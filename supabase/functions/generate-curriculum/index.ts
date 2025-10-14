import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PEDAGOGY_PROMPTS: Record<string, string> = {
  montessori: "Focus on hands-on, self-directed learning activities. Emphasize practical life skills and sensory experiences. Allow for student choice and independence.",
  classical: "Structure lessons in three stages: grammar (facts), logic (analysis), and rhetoric (expression). Emphasize classical texts, Socratic dialogue, and formal composition.",
  'charlotte-mason': "Include living books (quality literature), nature study, narration, and copywork. Focus on short lessons with full attention. Cultivate habits and relationships with ideas.",
  unschooling: "Follow the student's natural curiosity and interests. Create open-ended exploration opportunities. Connect learning to real-world experiences and projects.",
  traditional: "Use structured lessons with clear objectives. Include textbook-based instruction, practice problems, and assessment. Follow a sequential curriculum.",
  'project-based': "Design authentic, real-world projects that integrate multiple subjects. Include collaboration, inquiry, and presentation components.",
  waldorf: "Integrate arts and movement into academic learning. Use storytelling and imagination. Follow developmental stages with age-appropriate content.",
  eclectic: "Combine multiple pedagogical approaches based on what works best for this student. Adapt methods to fit the specific standard and learning objective.",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, approachOverride: requestApproachOverride } = await req.json();

    if (!courseId) {
      return new Response(JSON.stringify({ error: 'Course ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch course with all relevant data
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .select(`
        *,
        students (
          *
        ),
        curriculum_items (
          id,
          standards
        )
      `)
      .eq('id', courseId)
      .single();

    if (courseError) throw courseError;
    if (!course) throw new Error('Course not found');

    const student = course.students;
    const pacingConfig = course.pacing_config as any || {};
    const pedagogy = pacingConfig.pedagogy || 'eclectic';
    const framework = pacingConfig.framework || course.standards_scope?.[0]?.framework || 'CA-CCSS';
    const gradeLevel = course.grade_level || '10';
    const courseGoals = course.goals;
    const isCustomFramework = framework === 'CUSTOM';
    
    // Determine effective approach override: request-level takes priority over course-level
    let approachOverride = requestApproachOverride || '';
    if (!approachOverride && course.description && course.description.startsWith('APPROACH_OVERRIDE:')) {
      approachOverride = course.description.replace('APPROACH_OVERRIDE:', '').trim();
    }

    // Get standards - either custom or from database
    let allStandards = null;
    
    if (isCustomFramework) {
      // Use AI-generated custom standards
      allStandards = course.standards_scope?.[0]?.custom_standards || null;
    } else {
      // Get standards from database
      const { data, error: standardsError } = await supabaseClient
        .from('standards')
        .select('*')
        .eq('framework', framework)
        .eq('subject', course.subject)
        .eq('grade_band', gradeLevel);

      if (standardsError) {
        console.error('Standards error:', standardsError);
      }
      allStandards = data;
    }

    // Get covered standards from existing curriculum
    const coveredStandardCodes = new Set(
      course.curriculum_items?.flatMap((item: any) => 
        Array.isArray(item.standards) ? item.standards : []
      ) || []
    );

    // Find uncovered standards
    const uncoveredStandards = (allStandards || []).filter(
      (standard: any) => !coveredStandardCodes.has(standard.code)
    );

    // Check if we should use standards-based or goals-based generation
    const useGoalsBasedGeneration = !allStandards || allStandards.length === 0 || uncoveredStandards.length === 0;
    
    if (useGoalsBasedGeneration && !courseGoals) {
      return new Response(JSON.stringify({ 
        message: isCustomFramework 
          ? 'No learning milestones generated yet. Please edit course settings to generate milestones from your goals.'
          : 'No standards available and no course goals set. Please configure course goals in settings.',
        suggestions: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare student profile context
    const studentContext = {
      name: student.name,
      gradeLevel: student.grade_level || gradeLevel,
      personalityType: student.personality_type,
      learningProfile: student.learning_profile,
      accommodations: student.accommodations,
      specialInterests: student.special_interests,
    };

    // Get progress data to inform curriculum
    const { data: progressGaps } = await supabaseClient
      .from('progress_gaps')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', student.id)
      .is('addressed_at', null)
      .order('confidence_score', { ascending: false })
      .limit(10);

    // Get recent assignment performance
    const { data: recentGrades } = await supabaseClient
      .from('grades')
      .select(`
        *,
        assignments!inner (
          id,
          curriculum_item_id,
          curriculum_items!inner (
            title,
            standards,
            course_id
          )
        )
      `)
      .eq('student_id', student.id)
      .eq('assignments.curriculum_items.course_id', courseId)
      .order('graded_at', { ascending: false })
      .limit(20);

    // Get recent question-level performance
    const { data: recentResponses } = await supabaseClient
      .from('question_responses')
      .select(`
        *,
        submissions!inner (
          student_id,
          assignments!inner (
            curriculum_item_id,
            curriculum_items!inner (
              title,
              standards,
              course_id
            )
          )
        )
      `)
      .eq('submissions.student_id', student.id)
      .eq('submissions.assignments.curriculum_items.course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Analyze performance patterns
    const weakStandards = new Set<string>();
    const strongStandards = new Set<string>();
    
    // From grades
    recentGrades?.forEach(grade => {
      const standards = (grade.assignments?.curriculum_items as any)?.standards || [];
      if (grade.score !== null && grade.max_score !== null) {
        const percentage = (grade.score / grade.max_score) * 100;
        standards.forEach((code: string) => {
          if (percentage < 70) weakStandards.add(code);
          else if (percentage >= 85) strongStandards.add(code);
        });
      }
    });

    // From question responses
    recentResponses?.forEach(response => {
      const standards = (response.submissions?.assignments?.curriculum_items as any)?.standards || [];
      standards.forEach((code: string) => {
        if (response.is_correct === false) weakStandards.add(code);
        else if (response.is_correct === true) strongStandards.add(code);
      });
    });

    const performanceContext = {
      identifiedGaps: progressGaps?.map(g => ({
        standard: g.standard_code,
        gapType: g.gap_type,
        confidence: g.confidence_score
      })) || [],
      weakStandards: Array.from(weakStandards),
      strongStandards: Array.from(strongStandards),
      recentAverageScore: (recentGrades && recentGrades.length > 0)
        ? recentGrades.reduce((sum, g) => sum + (g.score || 0) / (g.max_score || 1), 0) / recentGrades.length * 100
        : null,
      totalQuestionsAnswered: recentResponses?.length || 0,
      correctAnswers: recentResponses?.filter(r => r.is_correct === true).length || 0
    };

    // Build AI prompt - different based on whether we have standards or goals
    const pedagogyGuidance = PEDAGOGY_PROMPTS[pedagogy] || PEDAGOGY_PROMPTS.eclectic;
    
    // Add approach override context if present
    const approachOverrideContext = approachOverride
      ? `\n🎯 CRITICAL REQUIREMENT - STUDENT'S PREFERRED APPROACH (HIGHEST PRIORITY):
"${approachOverride}"

THIS IS A DIRECT REQUEST FROM THE STUDENT. You MUST respect this approach and resource preference above all other learning style recommendations. If the student wants Khan Academy, use Khan Academy. If they want computer-based only, keep it computer-based. Do not force kinesthetic activities, props, costumes, or physical materials if they've specified otherwise.\n`
      : '';
    
    let systemPrompt: string;
    let userPrompt: string;

    if (useGoalsBasedGeneration) {
      // Goals-based generation when standards aren't available
      systemPrompt = `You are an expert curriculum designer creating assignments for ${course.subject} at grade ${gradeLevel} using ${pedagogy} pedagogy.

PEDAGOGY GUIDANCE:
${pedagogyGuidance}
${approachOverrideContext}
STUDENT PROFILE:
${JSON.stringify(studentContext, null, 2)}

RECENT PERFORMANCE DATA:
${JSON.stringify(performanceContext, null, 2)}

COURSE GOALS:
${courseGoals}

Your task is to generate assignment recommendations that:
1. Work toward achieving the stated course goals
2. Address identified weaknesses and gaps (prioritize these!)
3. Build on demonstrated strengths
4. Match the student's learning style and interests
5. Follow the specified pedagogy
6. Are engaging and developmentally appropriate
7. Include clear learning objectives and estimated time
8. Progress logically toward the course goals

CRITICAL: If the student has shown weakness in specific areas, prioritize creating curriculum that addresses those gaps with additional practice and scaffolding.`;

      userPrompt = `Generate 3-5 high-quality assignment recommendations that will help the student work toward the course goals: "${courseGoals}"

${performanceContext.weakStandards.length > 0 ? `
PRIORITY: The student has shown weakness in: ${performanceContext.weakStandards.slice(0, 5).join(', ')}
Address these gaps first with targeted practice and support.` : ''}

${performanceContext.strongStandards.length > 0 ? `
Build on their strengths in: ${performanceContext.strongStandards.slice(0, 5).join(', ')}` : ''}

Consider what foundational knowledge and skills the student needs to achieve these goals, create a logical progression of assignments, and adapt based on their actual performance data.`;
    } else {
      // Standards-based generation
      const priorityStandards = uncoveredStandards.slice(0, 5);
      
      // Prioritize weak standards if they're in uncovered list
      const sortedUncovered = [...uncoveredStandards].sort((a, b) => {
        const aWeak = performanceContext.weakStandards.includes(a.code);
        const bWeak = performanceContext.weakStandards.includes(b.code);
        if (aWeak && !bWeak) return -1;
        if (!aWeak && bWeak) return 1;
        return 0;
      });
      
      systemPrompt = `You are an expert curriculum designer creating assignments for ${course.subject} at grade ${gradeLevel} using ${pedagogy} pedagogy.

PEDAGOGY GUIDANCE:
${pedagogyGuidance}
${approachOverrideContext}
STUDENT PROFILE:
${JSON.stringify(studentContext, null, 2)}

RECENT PERFORMANCE DATA:
${JSON.stringify(performanceContext, null, 2)}

Your task is to generate assignment recommendations that:
1. Target specific uncovered standards
2. Address identified weaknesses and gaps (prioritize these!)
3. Build on demonstrated strengths
4. Match the student's learning style and interests
5. Follow the specified pedagogy
6. Are engaging and developmentally appropriate
7. Include clear learning objectives and estimated time

CRITICAL: If targeting standards where the student has shown weakness, provide extra scaffolding, practice, and support.`;

      userPrompt = `Generate assignment recommendations for the following uncovered standards (ordered by priority based on student's identified gaps):

${sortedUncovered.slice(0, 5).map((s: any, i: number) => {
  const isWeak = performanceContext.weakStandards.includes(s.code);
  return `${i + 1}. ${s.code}: ${s.text}${isWeak ? ' ⚠️ IDENTIFIED WEAKNESS - needs reinforcement' : ''}`;
}).join('\n\n')}

For each standard, suggest 1-2 high-quality assignments that would effectively cover that standard while:
- Addressing any identified weaknesses with appropriate scaffolding
- Building on demonstrated strengths
- Matching the student's profile and pedagogy`;
    }

    // Call Lovable AI with tool calling for structured output
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_assignment_suggestions',
              description: 'Generate assignment suggestions for uncovered standards',
              parameters: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Assignment title' },
                        description: { type: 'string', description: 'Detailed assignment description' },
                        standardCode: { type: 'string', description: 'Standard code being addressed' },
                        estimatedMinutes: { type: 'number', description: 'Estimated time in minutes' },
                        objectives: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'Learning objectives'
                        },
                        materials: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'Required materials or resources'
                        },
                        pedagogy_notes: { type: 'string', description: 'How this aligns with the pedagogy' }
                      },
                      required: ['title', 'description', 'standardCode', 'estimatedMinutes', 'objectives'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['suggestions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_assignment_suggestions' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call returned from AI');
    }

    const suggestions = JSON.parse(toolCall.function.arguments).suggestions;

    console.log(`Generated ${suggestions.length} assignment suggestions for course ${courseId} (${useGoalsBasedGeneration ? 'goals-based' : 'standards-based'})`);

    return new Response(JSON.stringify({ 
      suggestions,
      uncoveredCount: useGoalsBasedGeneration ? 0 : uncoveredStandards.length,
      pedagogy,
      framework,
      generationType: useGoalsBasedGeneration ? 'goals' : 'standards',
      goals: useGoalsBasedGeneration ? courseGoals : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in generate-curriculum:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
