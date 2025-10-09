import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, courseTitle, courseSubject, topic, gradeLevel, standards, studentProfile, isInitialAssessment } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get uncovered standards for this course
    let uncoveredStandards: Array<{ code: string; text: string }> = [];
    if (courseId && !isInitialAssessment) {
      // Get all standards for this framework and grade level
      const { data: courseData } = await supabase
        .from('courses')
        .select('standards_scope, subject, grade_level')
        .eq('id', courseId)
        .single();

      if (courseData?.standards_scope?.[0]?.framework) {
        const framework = courseData.standards_scope[0].framework;
        
        // Get all applicable standards
        const { data: allStandards } = await supabase
          .from('standards')
          .select('code, text')
          .eq('framework', framework)
          .eq('subject', courseData.subject)
          .or(`grade_band.eq.${courseData.grade_level},grade_band.like.%${courseData.grade_level}%`);

        // Get covered standards from existing assignments
        const { data: curriculumItems } = await supabase
          .from('curriculum_items')
          .select('standards')
          .eq('course_id', courseId);

        const coveredStandardCodes = new Set(
          curriculumItems?.flatMap(item => item.standards || []) || []
        );

        // Identify uncovered standards
        uncoveredStandards = (allStandards || []).filter(
          std => !coveredStandardCodes.has(std.code)
        );

        console.log('Standards analysis:', {
          total: allStandards?.length,
          covered: coveredStandardCodes.size,
          uncovered: uncoveredStandards.length
        });
      }
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating assignment for:', { courseTitle, courseSubject, topic, gradeLevel, isInitialAssessment });

    const studentContext = studentProfile ? `

STUDENT PROFILE:
- Display Name: ${studentProfile.display_name || 'Student'}
- Personality Type: ${studentProfile.personality_type || 'Not assessed'}
- Learning Profile: ${JSON.stringify(studentProfile.learning_profile || {})}
- ADHD Accommodations: ${JSON.stringify(studentProfile.accommodations || {})}
- Goals: ${JSON.stringify(studentProfile.goals || {})}

Use this profile to personalize the assignment. Consider:
- Their learning style and preferences
- Their interests and hobbies (incorporate them into examples/scenarios)
- Their strengths and weaknesses
- Any ADHD accommodations needed
- Their personality type and how they engage best
` : '';

    const assessmentContext = isInitialAssessment ? `
This is an INITIAL COURSE ASSESSMENT assignment. 

Purpose: Evaluate the student's current knowledge and skills for this course to:
1. Identify strengths and areas for growth
2. Establish a baseline for progress tracking
3. Inform future lesson planning
4. Adapt difficulty level to student's current abilities

Make questions diagnostic - covering key concepts and skills from throughout the course at varying difficulty levels.
Include questions that assess prerequisite knowledge as well as course content.
` : '';

    // Determine pedagogy approach based on framework and student profile
    const pedagogyContext = buildPedagogyContext(standards, studentProfile);
    
    // Add uncovered standards guidance
    const standardsGuidance = uncoveredStandards.length > 0 ? `
PRIORITY STANDARDS TO ADDRESS:
The following educational standards have NOT been covered yet in this course:
${uncoveredStandards.slice(0, 5).map(s => `- ${s.code}: ${s.text}`).join('\n')}

Please design this assignment to address one or more of these uncovered standards where relevant to the topic.
Include the standard codes in the alignment section of your response.
` : '';

    const systemPrompt = `You are an expert curriculum designer creating interactive digital assignments for homeschool students. 
Generate a complete assignment that includes:
1. Clear learning objectives
2. Detailed instructions
3. Interactive questions that can be auto-graded
4. Multiple question types (multiple choice, short answer, numeric)
5. Correct answers for auto-grading
6. Assessment rubric with criteria
7. Expected time to complete
8. Differentiation suggestions for ADHD learners
9. Teacher's guide with lesson-specific content
10. Standards alignment (specific standard codes addressed)

${studentContext}
${assessmentContext}
${standardsGuidance}
${pedagogyContext}

CRITICAL: Every assignment MUST include actual questions that students can answer digitally. Questions should test understanding and allow for mastery-based learning through multiple attempts.

TEACHER GUIDE REQUIREMENTS:
- All teacher guide content MUST be specific to this lesson topic and student profile
- NO GENERIC FILLER like "create a visual representation with art supplies"
- Beyond screen activities must be CONCRETE and directly related to the topic being taught
- Reference the student's specific interests, learning style, and challenges
- Provide topic-specific introduction strategies that connect to prior knowledge
- Give specific real-world examples and hands-on activities for THIS topic only`;

    const userPrompt = `Create a detailed interactive assignment for:
Course: ${courseTitle} (${courseSubject})
Topic: ${topic}
Grade Level: ${gradeLevel}
${standards ? `Standards to address: ${standards}` : ''}

Return a JSON object with this structure:
{
  "title": "Assignment title",
  "objectives": ["objective 1", "objective 2"],
  "instructions": "Detailed instructions for students",
  "materials": ["material 1", "material 2"],
  "activities": [
    {"step": 1, "description": "Activity description", "duration_minutes": 30}
  ],
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Question text",
      "points": 5,
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Why this answer is correct"
    },
    {
      "id": "q2",
      "type": "short_answer",
      "question": "Question text",
      "points": 10,
      "correct_answer": "Expected answer or key concepts",
      "explanation": "What makes a good answer"
    },
    {
      "id": "q3",
      "type": "numeric",
      "question": "Math problem",
      "points": 5,
      "correct_answer": 42,
      "tolerance": 0.01,
      "explanation": "How to solve this"
    }
  ],
  "rubric": [
    {"criteria": "Criteria name", "points": 10, "description": "What's expected"}
  ],
  "estimated_minutes": 60,
  "adhd_accommodations": ["accommodation 1", "accommodation 2"],
  "teacher_guide": {
    "lesson_overview": "Specific description of what this lesson teaches about [topic] and why it matters for this student",
    "course_alignment": "How this lesson fits into the course sequence - what came before, what builds on this, specific connections to course goals",
    "introduction_strategy": "Specific approach to introduce THIS topic to THIS student, including relevant prior knowledge to activate and specific questions to ask",
    "beyond_screen_activities": [
      {
        "title": "Specific activity name related to topic",
        "description": "Concrete, topic-specific activity tailored to student's interests and learning style. NOT generic art/building. Must directly relate to the lesson content.",
        "materials": ["specific materials needed"],
        "time_estimate": "20-30 minutes"
      },
      {
        "title": "Another specific activity",
        "description": "Another concrete activity for this topic only, incorporating student's interests where possible",
        "materials": ["specific materials"],
        "time_estimate": "30-45 minutes"
      }
    ],
    "discussion_prompts": [
      "Specific question about this topic that connects to student's interests or experiences",
      "Another discussion prompt specific to this lesson"
    ],
    "assessment_guidance": "How to assess understanding of THIS topic specifically, what mastery looks like for these concepts"
  },
  "standards_alignment": [
    {"code": "STANDARD.CODE.1", "description": "Brief description of how this assignment addresses this standard"}
  ]
}

Include 8-15 questions of varying difficulty. Mix question types appropriately for the subject.

CRITICAL: The teacher_guide must be 100% specific to this lesson topic and student. No generic suggestions.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = JSON.parse(data.choices[0].message.content);
    
    console.log('Generated assignment:', generatedContent);

    return new Response(JSON.stringify(generatedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-assignment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate assignment';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function buildPedagogyContext(standards: any, studentProfile: any): string {
  // Determine pedagogy approach based on framework
  let pedagogyApproach = '';
  
  if (standards && Array.isArray(standards)) {
    const framework = standards[0]?.framework;
    
    switch (framework) {
      case 'CA-CCSS':
      case 'Common Core':
        pedagogyApproach = `
PEDAGOGY APPROACH - Standards-Based Learning:
- Focus on mastery of specific standards through scaffolded instruction
- Use formative assessment to track progress toward standard mastery
- Provide clear success criteria aligned to standards
- Emphasize depth over breadth, ensuring thorough understanding
- Connect learning objectives explicitly to real-world applications`;
        break;
      
      case 'Montessori':
        pedagogyApproach = `
PEDAGOGY APPROACH - Montessori Method:
- Design self-directed learning activities with clear learning goals
- Provide hands-on, concrete materials and experiences
- Allow for student choice and autonomous exploration
- Emphasize practical life connections and real-world relevance
- Create multi-sensory learning opportunities
- Encourage intrinsic motivation over external rewards`;
        break;
      
      case 'Classical':
        pedagogyApproach = `
PEDAGOGY APPROACH - Classical Education:
- Structure content using the trivium (grammar, logic, rhetoric)
- Emphasize memorization of foundational facts and concepts
- Include analytical thinking and logical reasoning exercises
- Incorporate primary sources and original texts where appropriate
- Focus on mastery through repetition and practice
- Connect to classical literature and historical context`;
        break;
      
      default:
        pedagogyApproach = `
PEDAGOGY APPROACH - Adaptive Learning:
- Personalize instruction based on student's learning profile
- Use varied instructional strategies to accommodate different learning styles
- Provide multiple means of representation, action, and expression
- Build on prior knowledge and create meaningful connections`;
    }
  }
  
  // Add student-specific adaptations
  if (studentProfile?.learning_profile) {
    const profile = studentProfile.learning_profile;
    
    if (profile.learning_style?.includes('visual')) {
      pedagogyApproach += '\n- Incorporate visual aids, diagrams, and graphic organizers';
    }
    if (profile.learning_style?.includes('kinesthetic')) {
      pedagogyApproach += '\n- Include movement-based activities and hands-on tasks';
    }
    if (profile.learning_style?.includes('auditory')) {
      pedagogyApproach += '\n- Use verbal explanations, discussions, and audio elements';
    }
  }
  
  return pedagogyApproach;
}
