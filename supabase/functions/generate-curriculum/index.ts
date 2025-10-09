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
    const { courseId } = await req.json();

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

    // Get all standards for this course
    const { data: allStandards, error: standardsError } = await supabaseClient
      .from('standards')
      .select('*')
      .eq('framework', framework)
      .eq('subject', course.subject)
      .eq('grade_band', gradeLevel);

    if (standardsError) {
      console.error('Standards error:', standardsError);
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

    if (uncoveredStandards.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'All standards are covered',
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

    // Select top priority uncovered standards (limit to 5 for focused generation)
    const priorityStandards = uncoveredStandards.slice(0, 5);

    // Build AI prompt
    const pedagogyGuidance = PEDAGOGY_PROMPTS[pedagogy] || PEDAGOGY_PROMPTS.eclectic;
    
    const systemPrompt = `You are an expert curriculum designer creating assignments for ${course.subject} at grade ${gradeLevel} using ${pedagogy} pedagogy.

PEDAGOGY GUIDANCE:
${pedagogyGuidance}

STUDENT PROFILE:
${JSON.stringify(studentContext, null, 2)}

Your task is to generate assignment recommendations that:
1. Target specific uncovered standards
2. Match the student's learning style and interests
3. Follow the specified pedagogy
4. Are engaging and developmentally appropriate
5. Include clear learning objectives and estimated time`;

    const userPrompt = `Generate assignment recommendations for the following uncovered standards:

${priorityStandards.map((s: any, i: number) => `${i + 1}. ${s.code}: ${s.text}`).join('\n\n')}

For each standard, suggest 1-2 high-quality assignments that would effectively cover that standard while matching the student's profile and pedagogy.`;

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

    console.log(`Generated ${suggestions.length} assignment suggestions for course ${courseId}`);

    return new Response(JSON.stringify({ 
      suggestions,
      uncoveredCount: uncoveredStandards.length,
      pedagogy,
      framework
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
