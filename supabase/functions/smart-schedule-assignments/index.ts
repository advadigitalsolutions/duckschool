import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Assignment {
  id: string;
  curriculum_item_id: string;
  due_at: string | null;
  est_minutes: number;
  prerequisite_assignments: string[] | null;
  scheduling_flexibility: number;
  optimal_time_of_day: string[] | null;
  locked_schedule: boolean;
  auto_scheduled_time: string | null;
  curriculum_items: {
    title: string;
    course_id: string;
  };
}

interface FocusPattern {
  peak_windows: Array<{ start_time: string; end_time: string; average_score: number }>;
  subject_optimal_times: Record<string, Array<{ start_time: string; score: number }>>;
  day_of_week_patterns: Record<string, { average_score: number }>;
}

interface SchedulingBlock {
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  block_type: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { studentId, startDate, endDate, includeAnalysis } = await req.json();

    if (!studentId) {
      throw new Error('studentId is required');
    }

    console.log(`🗓️ Scheduling assignments for student ${studentId} from ${startDate} to ${endDate}`);

    // 1. Fetch ALL assigned assignments (both scheduled and unscheduled)
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        curriculum_item_id,
        due_at,
        prerequisite_assignments,
        scheduling_flexibility,
        optimal_time_of_day,
        locked_schedule,
        auto_scheduled_time,
        day_of_week,
        curriculum_items!inner (
          title,
          est_minutes,
          course_id,
          courses!inner (
            student_id,
            subject
          )
        )
      `)
      .eq('curriculum_items.courses.student_id', studentId)
      .eq('status', 'assigned')
      .eq('locked_schedule', false); // Only consider unlocked assignments for optimization

    if (assignmentsError) throw assignmentsError;

    if (!assignments || assignments.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No assignments to optimize',
          scheduled: [],
          analysis: {
            summary: 'No unlocked assignments found to schedule or optimize.',
            changes: [],
            recommendations: []
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${assignments.length} assignments (${assignments.filter((a: any) => a.auto_scheduled_time).length} already scheduled)`);

    // Separate scheduled and unscheduled
    const unscheduled = assignments.filter((a: any) => !a.auto_scheduled_time);
    const alreadyScheduled = assignments.filter((a: any) => a.auto_scheduled_time);

    // 2. Fetch focus patterns
    const { data: patterns, error: patternsError } = await supabase
      .from('student_focus_patterns')
      .select('*')
      .eq('student_id', studentId)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    if (patternsError && patternsError.code !== 'PGRST116') {
      console.warn('⚠️ Error fetching focus patterns:', patternsError);
    }

    // 3. Fetch scheduling blocks
    const { data: blocks, error: blocksError } = await supabase
      .from('scheduling_blocks')
      .select('*')
      .eq('student_id', studentId)
      .eq('active', true);

    if (blocksError) {
      console.warn('⚠️ Error fetching scheduling blocks:', blocksError);
    }

    const schedulingBlocks = blocks || [];

    // 4. Schedule new assignments and analyze existing ones
    const { scheduled: newlyScheduled, notes: scheduleNotes } = scheduleAssignments(
      unscheduled as any[],
      patterns as FocusPattern | null,
      schedulingBlocks as SchedulingBlock[],
      startDate ? new Date(startDate) : new Date(),
      endDate ? new Date(endDate) : addDays(new Date(), 14)
    );

    // 5. Always run AI analysis to evaluate the entire schedule
    console.log('🤖 Running AI analysis on schedule...');
    const analysis = await generateScheduleAnalysis(
      newlyScheduled,
      alreadyScheduled,
      unscheduled as any[],
      patterns as FocusPattern | null,
      schedulingBlocks
    );

    // 6. Update only the newly scheduled assignments
    const updates = newlyScheduled.map(async (scheduled) => {
      const timeOnly = scheduled.scheduledTime.split('T')[1];
      
      console.log(`🔍 About to update assignment ${scheduled.assignmentId}:`, {
        auto_scheduled_time: timeOnly,
        day_of_week: scheduled.dayOfWeek,
        dayOfWeekType: typeof scheduled.dayOfWeek,
        dayOfWeekValue: JSON.stringify(scheduled.dayOfWeek)
      });
      
      const { error } = await supabase
        .from('assignments')
        .update({
          auto_scheduled_time: timeOnly,
          day_of_week: scheduled.dayOfWeek
        })
        .eq('id', scheduled.assignmentId);

      if (error) {
        console.error(`❌ Error updating assignment ${scheduled.assignmentId}:`, error);
      }

      return { ...scheduled, error };
    });

    const results = await Promise.all(updates);

    console.log(`✅ Scheduled ${results.filter(r => !r.error).length} new assignments`);

    return new Response(
      JSON.stringify({
        message: unscheduled.length === 0 && alreadyScheduled.length > 0 
          ? 'Schedule optimized - reviewing existing assignments'
          : 'Scheduling complete',
        scheduled: results.filter(r => !r.error),
        errors: results.filter(r => r.error),
        notes: scheduleNotes,
        analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Scheduling error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function scheduleAssignments(
  assignments: any[],
  patterns: FocusPattern | null,
  blocks: SchedulingBlock[],
  startDate: Date,
  endDate: Date
): { scheduled: Array<{ assignmentId: string; scheduledTime: string; dayOfWeek: string; score: number }>, notes: string[] } {
  const scheduled: Array<{ assignmentId: string; scheduledTime: string; dayOfWeek: string; score: number }> = [];
  const usedSlots = new Set<string>();
  const notes: string[] = [];
  
  // Add scheduling context notes
  if (blocks.length > 0) {
    notes.push(`Avoided ${blocks.length} blocked time slot(s) for appointments and activities.`);
  }
  if (patterns?.peak_windows && patterns.peak_windows.length > 0) {
    notes.push(`Prioritized your peak focus windows for optimal learning.`);
  }

  // Sort by due date and priority
  const sortedAssignments = [...assignments].sort((a, b) => {
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  for (const assignment of sortedAssignments) {
    const estMinutes = assignment.curriculum_items.est_minutes || 30;
    const dueDate = assignment.due_at ? new Date(assignment.due_at) : endDate;
    const subject = assignment.curriculum_items.courses.subject;

    // Find best time slot
    let bestSlot: { date: Date; time: string; score: number } | null = null;
    let bestScore = 0;

    for (let d = new Date(startDate); d <= dueDate && d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const dateStr = d.toISOString().split('T')[0];

      // Only block "unavailable" times - everything else overlaps
      const isBlocked = blocks.some(block => {
        if (block.block_type !== 'unavailable') return false;
        if (block.specific_date && block.specific_date === dateStr) return true;
        if (block.day_of_week !== null && block.day_of_week === dayOfWeek) return true;
        return false;
      });

      if (isBlocked) continue;

      // Generate time slots (9 AM to 9 PM, every 30 minutes)
      for (let hour = 9; hour < 21; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const slotKey = `${dateStr}T${timeStr}`;

          if (usedSlots.has(slotKey)) continue;

          const score = calculateSlotScore(
            timeStr,
            dayOfWeek,
            subject,
            patterns,
            assignment.optimal_time_of_day
          );

          if (score > bestScore) {
            bestScore = score;
            bestSlot = {
              date: new Date(d),
              time: timeStr,
              score
            };
          }
        }
      }
    }

    if (bestSlot) {
      const scheduledDateTime = `${bestSlot.date.toISOString().split('T')[0]}T${bestSlot.time}:00`;
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][bestSlot.date.getDay()];

      scheduled.push({
        assignmentId: assignment.id,
        scheduledTime: scheduledDateTime,
        dayOfWeek: dayName,
        score: bestSlot.score
      });

      usedSlots.add(`${bestSlot.date.toISOString().split('T')[0]}T${bestSlot.time}`);

      console.log(`📅 Scheduled "${assignment.curriculum_items.title}" for ${scheduledDateTime} (score: ${bestSlot.score.toFixed(2)})`);
    } else {
      console.warn(`⚠️ Could not find slot for "${assignment.curriculum_items.title}"`);
    }
  }
  
  if (scheduled.length > 0) {
    notes.push(`Successfully scheduled ${scheduled.length} assignment(s) based on due dates and your learning patterns.`);
  }

  return { scheduled, notes };
}

function calculateSlotScore(
  timeStr: string,
  dayOfWeek: number,
  subject: string,
  patterns: FocusPattern | null,
  optimalTimes: string[] | null
): number {
  let score = 0.5; // Base score

  if (!patterns) return score;

  // Check if time is in peak focus window
  if (patterns.peak_windows) {
    for (const window of patterns.peak_windows) {
      if (isTimeInRange(timeStr, window.start_time, window.end_time)) {
        score += window.average_score * 0.4; // 40% weight
        break;
      }
    }
  }

  // Check subject-specific optimal times
  if (patterns.subject_optimal_times && patterns.subject_optimal_times[subject]) {
    const subjectTimes = patterns.subject_optimal_times[subject];
    const closestTime = subjectTimes.reduce((prev, curr) => {
      const prevDiff = Math.abs(timeToMinutes(prev.start_time) - timeToMinutes(timeStr));
      const currDiff = Math.abs(timeToMinutes(curr.start_time) - timeToMinutes(timeStr));
      return currDiff < prevDiff ? curr : prev;
    });

    if (closestTime && Math.abs(timeToMinutes(closestTime.start_time) - timeToMinutes(timeStr)) < 60) {
      score += closestTime.score * 0.3; // 30% weight
    }
  }

  // Check day of week preference
  if (patterns.day_of_week_patterns) {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    const dayPattern = patterns.day_of_week_patterns[dayName];
    if (dayPattern) {
      score += dayPattern.average_score * 0.2; // 20% weight
    }
  }

  // Check assignment's optimal time preference
  if (optimalTimes && optimalTimes.length > 0) {
    const hour = parseInt(timeStr.split(':')[0]);
    if (optimalTimes.includes('morning') && hour >= 6 && hour < 12) score += 0.1;
    if (optimalTimes.includes('afternoon') && hour >= 12 && hour < 18) score += 0.1;
    if (optimalTimes.includes('evening') && hour >= 18 && hour < 22) score += 0.1;
  }

  return Math.min(score, 1.0);
}

function isTimeInRange(time: string, start: string, end: string): boolean {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function generateScheduleAnalysis(
  scheduledResults: any[],
  alreadyScheduled: any[],
  unscheduledAssignments: any[],
  patterns: FocusPattern | null,
  blocks: SchedulingBlock[]
): Promise<{
  summary: string;
  changes: Array<{ assignment: string; reason: string }>;
  recommendations: string[];
}> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Prepare context for AI
  const newScheduleContext = scheduledResults.map((result) => {
    const assignment = unscheduledAssignments.find((a: any) => a.id === result.assignmentId);
    return {
      title: assignment?.curriculum_items?.title || 'Unknown',
      subject: assignment?.curriculum_items?.courses?.subject || 'Unknown',
      scheduledTime: result.scheduledTime,
      dayOfWeek: result.dayOfWeek,
      score: result.score.toFixed(2)
    };
  });

  const existingScheduleContext = alreadyScheduled.map((a: any) => ({
    title: a.curriculum_items?.title || 'Unknown',
    subject: a.curriculum_items?.courses?.subject || 'Unknown',
    dayOfWeek: a.day_of_week,
    scheduledTime: a.auto_scheduled_time
  }));

  const systemPrompt = `You are an educational scheduling expert. Analyze the complete schedule and provide clear, actionable insights.

Your role:
1. Review both newly scheduled AND existing assignments
2. Determine if the current schedule is optimal or if improvements could be made
3. Explain key factors that make the schedule effective
4. Provide specific recommendations if optimization is possible

Be direct, specific, and educational in your analysis.`;

  const userPrompt = `Analyze this student's schedule:

NEWLY SCHEDULED (${scheduledResults.length}):
${JSON.stringify(newScheduleContext, null, 2)}

ALREADY SCHEDULED (${alreadyScheduled.length}):
${JSON.stringify(existingScheduleContext, null, 2)}

${patterns ? `Focus Patterns: ${patterns.peak_windows?.length || 0} peak windows identified` : 'Focus Patterns: Not yet established'}
${blocks.length > 0 ? `Blocked Times: ${blocks.length} time slots unavailable` : 'No blocked time slots'}

Provide:
1. A summary explaining whether the schedule is optimal or could be improved
2. For newly scheduled assignments, explain the placement rationale
3. For existing assignments, note if they're well-placed or could be optimized
4. 2-3 specific recommendations for schedule optimization

${scheduledResults.length === 0 && alreadyScheduled.length > 0 ? 'NOTE: No new assignments were added. Evaluate if the existing schedule is optimal or if redistributing assignments would improve learning outcomes.' : ''}

Format as JSON:
{
  "summary": "overall evaluation and key scheduling principles applied",
  "changes": [
    {"assignment": "title", "reason": "placement rationale or optimization suggestion"}
  ],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2"]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini-2025-08-07',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 1000,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI analysis error:', response.status, errorText);
    
    // Return a basic analysis on error
    const allAssignments = [...newScheduleContext, ...existingScheduleContext];
    return {
      summary: scheduledResults.length > 0 
        ? `Scheduled ${scheduledResults.length} new assignments. ${alreadyScheduled.length} assignments remain on their current schedule.`
        : `Reviewed ${alreadyScheduled.length} existing assignments. Current schedule appears well-optimized based on available data.`,
      changes: allAssignments.map((ctx: any) => ({
        assignment: ctx.title,
        reason: ctx.scheduledTime 
          ? `Placed at ${ctx.dayOfWeek} ${ctx.scheduledTime.split('T')[1] || ctx.scheduledTime} based on availability and focus patterns.`
          : `Currently scheduled for ${ctx.dayOfWeek}`
      })),
      recommendations: [
        'Continue tracking focus patterns to improve future scheduling',
        'Review blocked time slots regularly to ensure accuracy'
      ]
    };
  }

  const aiData = await response.json();
  const analysisText = aiData.choices[0].message.content;
  
  try {
    return JSON.parse(analysisText);
  } catch {
    // Fallback if JSON parsing fails
    const allAssignments = [...newScheduleContext, ...existingScheduleContext];
    return {
      summary: analysisText,
      changes: allAssignments.map((ctx: any) => ({
        assignment: ctx.title,
        reason: `Scheduled for ${ctx.dayOfWeek} based on optimal learning times.`
      })),
      recommendations: []
    };
  }
}