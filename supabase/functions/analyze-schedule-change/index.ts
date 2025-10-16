import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { assignmentId, newDay, newTime, studentId } = await req.json();

    console.log('🔍 Analyzing schedule change:', { assignmentId, newDay, newTime, studentId });

    // 1. Get assignment details with curriculum context
    const { data: assignmentData, error: assignmentError } = await supabase
      .from('assignments')
      .select(`
        id,
        curriculum_items!inner(
          id,
          title,
          body,
          course_id,
          standards,
          courses!inner(
            subject,
            title,
            student_id
          )
        ),
        prerequisite_assignments,
        auto_scheduled_time,
        day_of_week
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) throw assignmentError || new Error('Assignment not found');

    const assignment = assignmentData as any;

    // 2. Get student's focus patterns for the proposed time
    const proposedDateTime = new Date();
    const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(newDay.toLowerCase());
    proposedDateTime.setDate(proposedDateTime.getDate() + (dayIndex - proposedDateTime.getDay()));
    const [hours, minutes] = newTime.split(':');
    proposedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const { data: focusPatterns } = await supabase
      .from('activity_events')
      .select('event_type, timestamp, metadata')
      .eq('student_id', studentId)
      .eq('page_context', '/assignment')
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(500);

    // 3. Check prerequisite assignments and their schedules
    const prerequisiteData: any[] = [];
    if (assignment.prerequisite_assignments && assignment.prerequisite_assignments.length > 0) {
      const { data: prerequisites } = await supabase
        .from('assignments')
        .select(`
          id,
          auto_scheduled_time,
          day_of_week,
          curriculum_items!inner(
            title,
            standards
          )
        `)
        .in('id', assignment.prerequisite_assignments);
      
      if (prerequisites) {
        prerequisiteData.push(...prerequisites);
      }
    }

    // 4. Prepare context for AI analysis
    const analysisContext = {
      assignment: {
        title: assignment.curriculum_items.title,
        subject: assignment.curriculum_items.courses.subject,
        standards: assignment.curriculum_items.standards,
        currentSchedule: {
          day: assignment.day_of_week,
          time: assignment.auto_scheduled_time
        },
        proposedSchedule: {
          day: newDay,
          time: newTime
        }
      },
      prerequisites: prerequisiteData.map((p: any) => ({
        title: p.curriculum_items.title,
        scheduledDay: p.day_of_week,
        scheduledTime: p.auto_scheduled_time,
        standards: p.curriculum_items.standards
      })),
      focusPatterns: {
        totalEvents: focusPatterns?.length || 0,
        proposedDayOfWeek: newDay,
        proposedTime: newTime
      }
    };

    // 5. Call OpenAI for analysis
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          {
            role: 'system',
            content: `You are an educational scheduling assistant. Analyze proposed schedule changes and provide brief, actionable feedback.

Consider:
1. Focus patterns: Does the student typically struggle at this time based on historical data?
2. Prerequisite sequence: Are foundational concepts scheduled before advanced ones?
3. Subject balancing: Is the timing appropriate for the subject's cognitive demands?

Respond in 2-3 sentences with either approval or specific concerns. Be direct and helpful.`
          },
          {
            role: 'user',
            content: `Should we move this assignment?

Assignment: "${analysisContext.assignment.title}" (${analysisContext.assignment.subject})
Current: ${analysisContext.assignment.currentSchedule.day || 'unscheduled'} at ${analysisContext.assignment.currentSchedule.time || 'no time'}
Proposed: ${analysisContext.assignment.proposedSchedule.day} at ${analysisContext.assignment.proposedSchedule.time}

${prerequisiteData.length > 0 ? `Prerequisites (${prerequisiteData.length}): ${prerequisiteData.map((p: any) => `"${p.curriculum_items.title}" scheduled ${p.day_of_week || 'unscheduled'} at ${p.auto_scheduled_time || 'no time'}`).join(', ')}` : 'No prerequisites'}

Historical activity: ${focusPatterns?.length || 0} learning events recorded in past 30 days`
          }
        ],
        max_completion_tokens: 200
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      // Handle specific error cases with user-friendly messages
      if (aiResponse.status === 402 || aiResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'AI analysis unavailable: OpenAI API key not configured or credits depleted.',
            analysis: 'AI analysis unavailable. You can still manually reassign this assignment based on your judgment.'
          }),
          { 
            status: 200, // Return 200 so the dialog can show the message gracefully
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again in a moment.',
            analysis: 'AI analysis temporarily unavailable due to rate limits. Please try again shortly or proceed with manual reassignment.'
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0].message.content;

    console.log('✅ Schedule analysis complete');

    return new Response(
      JSON.stringify({ 
        analysis,
        context: analysisContext 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing schedule change:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
