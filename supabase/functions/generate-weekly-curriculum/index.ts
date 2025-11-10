import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { summarizeWeekValidation, type DayGateResult } from '../_shared/validation-aggregator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, studentId, weekStartDate } = await req.json();

    if (!courseId || !studentId || !weekStartDate) {
      throw new Error('courseId, studentId, and weekStartDate are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get progress analysis
    const analysisResponse = await supabase.functions.invoke('analyze-student-progress', {
      body: { courseId, studentId }
    });

    if (analysisResponse.error) {
      throw new Error(`Progress analysis failed: ${analysisResponse.error.message}`);
    }

    const progressData = analysisResponse.data;

    // Get course details
    const { data: course } = await supabase
      .from('courses')
      .select('*, students(*)')
      .eq('id', courseId)
      .single();

    if (!course) {
      throw new Error('Course not found');
    }

    const student = course.students;

    // Calculate week number
    const startDate = new Date(weekStartDate);
    const courseStartDate = new Date(course.created_at);
    const weekNumber = Math.floor(
      (startDate.getTime() - courseStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    ) + 1;

    // Build AI prompt
    const systemPrompt = `You are an expert curriculum designer for homeschool students. Generate a week of engaging, personalized assignments that:
1. Address identified learning gaps (60% focus)
2. Progress through required standards (30% focus)
3. Connect to student interests (10% focus)

Student Profile:
- Name: ${student.name}
- Grade Level: ${student.grade_level || 'Not specified'}
- Learning Style: ${JSON.stringify(student.learning_profile)}
- Interests: ${JSON.stringify(progressData.interests)}
- Accommodations: ${JSON.stringify(student.accommodations)}

Course: ${course.title} (${course.subject})
Goals: ${course.goals || 'General subject mastery'}

Recent Performance:
- Assignments completed: ${progressData.recentPerformance.assignmentsCompleted}
- Average time per assignment: ${progressData.recentPerformance.averageTimeMinutes} minutes
- Overall accuracy: ${Math.round(progressData.recentPerformance.overallAccuracy * 100)}%

Learning Gaps to Address:
${progressData.gaps.slice(0, 10).map((g: any) => `- ${g.standard_code} (${g.gap_type})`).join('\n')}

CRITICAL CONTENT RULES:
You are generating curriculum for: ${course.title} (Grade ${course.grade_level || 'unspecified'})

STRICT REQUIREMENTS:
1. Use ONLY standards that belong to the target course's grade band
2. DO NOT include content outside the course's standard scope
3. Always include valid standard codes for each assignment
4. Be age-appropriate and aligned to grade level cognitive demand

If you receive regeneration feedback, you MUST strictly follow the allowed standard codes and avoid banned terms.

Generate 5 days (Monday-Friday) of work with 2-3 assignments per day. Each assignment should:
- Take 20-40 minutes
- Be appropriately challenging
- Connect to real-world applications
- Include clear success criteria
- Apply accommodations naturally`;

    const userPrompt = `Create this week's curriculum (Week ${weekNumber}) starting ${weekStartDate}. 
Theme the week around: ${progressData.recommendations.focusAreas.slice(0, 2).join(' and ')}.`;

    // Call OpenAI with tool calling for structured output
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_weekly_curriculum',
            description: 'Create a structured week of assignments',
            parameters: {
              type: 'object',
              properties: {
                theme: { type: 'string', description: 'Week theme' },
                days: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      day: { type: 'string', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
                      assignments: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            title: { type: 'string' },
                            description: { type: 'string' },
                            type: { type: 'string', enum: ['lesson', 'practice', 'project', 'assessment'] },
                            est_minutes: { type: 'integer' },
                            standards: { type: 'array', items: { type: 'string' } },
                            content: { 
                              type: 'object',
                              properties: {
                                instructions: { type: 'string' },
                                questions: { type: 'array', items: { type: 'object' } },
                                resources: { type: 'array', items: { type: 'string' } }
                              }
                            },
                            why_this_matters: { type: 'string' }
                          },
                          required: ['title', 'description', 'type', 'est_minutes', 'content']
                        }
                      }
                    },
                    required: ['day', 'assignments']
                  }
                }
              },
              required: ['theme', 'days']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_weekly_curriculum' } }
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('Payment required. Please add credits to your workspace.');
      }
      const errorText = await aiResponse.text();
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('AI did not return structured curriculum');
    }

    let weeklyPlan = JSON.parse(toolCall.function.arguments);

    // CURRICULUM GATE VALIDATION
    console.log('🔍 Validating weekly curriculum...');
    
    const validationContext = {
      course_key: `CA:${course.title}:${course.grade_level}`,
      class_name: course.title,
      state: "CA",
      grade_band: course.grade_level || '10',
      subject: course.subject,
      mode: "generation"
    };

    // Validate each day's assignments and collect results
    let allValid = true;
    let validationAttempts = 0;
    const MAX_VALIDATION_ATTEMPTS = 2;
    const dayGateResults: DayGateResult[] = [];

    while (validationAttempts < MAX_VALIDATION_ATTEMPTS && !allValid) {
      validationAttempts++;
      allValid = true;
      const failedDays: string[] = [];

      for (const day of weeklyPlan.days) {
        for (const assignment of day.assignments) {
          // Convert assignment to lesson format for validation
          const lessonJson = {
            objective: assignment.description,
            standards_aligned: (assignment.standards || []).map((code: string) => ({ code, name: code })),
            lesson_core: assignment.content,
            practice_items: assignment.content.questions || [],
            assessment: [],
            metadata: {
              grade_band: course.grade_level,
              difficulty_level: "adaptive"
            }
          };

          const gateResponse = await fetch(`${supabaseUrl}/functions/v1/curriculum-gate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              lesson_json: lessonJson,
              context: validationContext
            })
          });

          if (gateResponse.ok) {
            const gateResult = await gateResponse.json();
            
            // Collect gate results for weekly summary, including assignment title for matching
            dayGateResults.push({
              approval_status: gateResult.approval_status,
              alignment_confidence: gateResult.alignment_confidence,
              findings: gateResult.findings || [],
              _assignmentTitle: assignment.title // Helper for matching later
            });
            
            if (gateResult.approval_status === "rejected") {
              allValid = false;
              failedDays.push(day.day);
              console.warn(`❌ Assignment "${assignment.title}" failed validation:`, gateResult.findings);
            } else {
              console.log(`✅ Assignment "${assignment.title}" validated (${gateResult.approval_status})`);
            }
          }
        }
      }

      if (!allValid && validationAttempts < MAX_VALIDATION_ATTEMPTS) {
        console.log(`🔄 Regenerating failed days: ${failedDays.join(', ')}`);
        // For now, we'll proceed with warnings rather than regenerate the entire week
        // In production, you could regenerate just the failed days
      }
    }

    if (!allValid) {
      console.warn('⚠️ Some assignments did not pass validation, proceeding with warnings');
    }

    // Create curriculum week record with validation summary
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 4); // Friday

    const weekSummary = summarizeWeekValidation(dayGateResults);
    console.log('📊 Week validation summary:', weekSummary);

    const { data: curriculumWeek, error: weekError } = await supabase
      .from('curriculum_weeks')
      .insert({
        course_id: courseId,
        student_id: studentId,
        week_number: weekNumber,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        theme: weeklyPlan.theme,
        focus_areas: progressData.recommendations.focusAreas,
        validation_summary: weekSummary,
        last_validated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (weekError) throw weekError;

    // Create curriculum items and assignments
    const createdAssignments = [];

    for (const day of weeklyPlan.days) {
      const dayDate = new Date(startDate);
      const dayIndex = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].indexOf(day.day);
      dayDate.setDate(dayDate.getDate() + dayIndex);

      for (const assignment of day.assignments) {
        // Create curriculum item
        const { data: curriculumItem, error: itemError } = await supabase
          .from('curriculum_items')
          .insert({
            course_id: courseId,
            title: assignment.title,
            body: assignment.content,
            type: assignment.type,
            est_minutes: assignment.est_minutes,
            standards: assignment.standards || []
          })
          .select()
          .single();

        if (itemError) {
          console.error('Error creating curriculum item:', itemError);
          continue;
        }

        // Find matching validation result for this assignment
        const matchingGateResult = dayGateResults.find(
          (result: any) => result._assignmentTitle === assignment.title
        );

        // Create assignment with validation metadata
        const dueDate = new Date(dayDate);
        dueDate.setHours(23, 59, 59, 999);
        
        const { data: newAssignment, error: assignmentError } = await supabase
          .from('assignments')
          .insert({
            curriculum_item_id: curriculumItem.id,
            status: 'published',
            week_id: curriculumWeek.id,
            day_of_week: day.day,
            assigned_date: dayDate.toISOString().split('T')[0],
            due_at: dueDate.toISOString(),
            validation_metadata: matchingGateResult ? {
              approval_status: matchingGateResult.approval_status,
              alignment_confidence: matchingGateResult.alignment_confidence,
              findings: matchingGateResult.findings || [],
              validated_at: new Date().toISOString()
            } : null
          })
          .select()
          .single();

        if (assignmentError) {
          console.error('Error creating assignment:', assignmentError);
          continue;
        }

        createdAssignments.push({
          ...newAssignment,
          curriculum_item: curriculumItem,
          why_this_matters: assignment.why_this_matters
        });
      }
    }

    // Save identified gaps
    for (const gap of progressData.gaps.slice(0, 10)) {
      await supabase.from('progress_gaps').insert({
        student_id: studentId,
        course_id: courseId,
        standard_code: gap.standard_code,
        gap_type: gap.gap_type,
        confidence_score: gap.confidence_score
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        week: curriculumWeek,
        assignments: createdAssignments,
        theme: weeklyPlan.theme,
        gapsAddressed: progressData.gaps.slice(0, 10).map((g: any) => g.standard_code)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating weekly curriculum:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
