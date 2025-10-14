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
    const { 
      courseIds, 
      coursesData, 
      topic, 
      gradeLevel, 
      studentProfile, 
      enableCrossSubject, 
      manualStandards,
      isInitialAssessment,
      // Legacy single-course support
      courseId,
      courseTitle,
      courseSubject,
      standards
    } = await req.json();
    
    // Support both multi-course and legacy single-course mode
    const isMultiCourse = courseIds && courseIds.length > 0;
    const targetCourseIds = isMultiCourse ? courseIds : [courseId];
    const targetCoursesData = isMultiCourse ? coursesData : [{
      id: courseId,
      title: courseTitle,
      subject: courseSubject,
      grade_level: gradeLevel,
      standards_scope: standards
    }];
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get comprehensive context for assignment generation
    let parentProfile = null;
    let studentGoals = null;
    let studentInterests = null;
    let customFramework = null;

    if (studentProfile?.parent_id) {
      // Get parent/teacher profile
      const { data: parent } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentProfile.parent_id)
        .single();
      parentProfile = parent;
    }

    if (courseId) {
      // Get custom framework if course uses one
      const { data: course } = await supabase
        .from('courses')
        .select('standards_scope')
        .eq('id', courseId)
        .single();

      if (course?.standards_scope?.[0]?.framework === 'CUSTOM') {
        const frameworkId = course.standards_scope[0].framework_id;
        const { data: framework } = await supabase
          .from('custom_frameworks')
          .select('*')
          .eq('id', frameworkId)
          .single();
        customFramework = framework;
      }
    }

    // Extract student goals and interests from profile
    if (studentProfile) {
      studentGoals = studentProfile.goals || {};
      studentInterests = studentProfile.special_interests || [];
    }

    // Get student's weak areas for cross-subject integration
    let weakAreas: Array<{ subject: string; standard: string; description: string }> = [];
    if (enableCrossSubject && isMultiCourse) {
      // Get progress gaps
      const { data: gaps } = await supabase
        .from('progress_gaps')
        .select('*, courses!inner(subject, title)')
        .eq('student_id', studentProfile.id)
        .is('addressed_at', null)
        .order('confidence_score', { ascending: true })
        .limit(10);

      // Get recent low-scoring assessments
      const { data: recentGrades } = await supabase
        .from('grades')
        .select('*, assignments!inner(curriculum_items!inner(course_id, standards, courses!inner(subject)))')
        .eq('student_id', studentProfile.id)
        .lt('score', 70)
        .order('graded_at', { ascending: false })
        .limit(10);

      if (gaps) {
        weakAreas = gaps.map(gap => ({
          subject: gap.courses?.subject || 'Unknown',
          standard: gap.standard_code,
          description: gap.gap_type
        }));
      }

      console.log('Weak areas identified for cross-subject integration:', weakAreas);
    }

    // Get uncovered standards for courses
    let uncoveredStandards: Array<{ code: string; text: string; subject?: string }> = [];
    if (!isInitialAssessment && targetCourseIds.length > 0) {
      // Get all standards for all selected courses
      for (const cId of targetCourseIds) {
        const { data: courseData } = await supabase
          .from('courses')
          .select('standards_scope, subject, grade_level')
          .eq('id', cId)
          .single();

        if (courseData?.standards_scope?.[0]?.framework) {
          const framework = courseData.standards_scope[0].framework;
          
          // Get all applicable standards
          const { data: allStandards } = await supabase
            .from('standards')
            .select('code, text, subject')
            .eq('framework', framework)
            .eq('subject', courseData.subject)
            .or(`grade_band.eq.${courseData.grade_level},grade_band.like.%${courseData.grade_level}%`);

          // Get covered standards from existing assignments
          const { data: curriculumItems } = await supabase
            .from('curriculum_items')
            .select('standards')
            .eq('course_id', cId);

          const coveredStandardCodes = new Set(
            curriculumItems?.flatMap(item => item.standards || []) || []
          );

          // Identify uncovered standards for this course
          const courseUncovered = (allStandards || []).filter(
            std => !coveredStandardCodes.has(std.code)
          );

          uncoveredStandards = [...uncoveredStandards, ...courseUncovered];

          console.log(`Standards analysis for course ${cId}:`, {
            subject: courseData.subject,
            total: allStandards?.length,
            covered: coveredStandardCodes.size,
            uncovered: courseUncovered.length
          });
        }
      }
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating assignment for:', { 
      courses: targetCoursesData.map((c: any) => `${c.title} (${c.subject})`).join(', '),
      topic, 
      gradeLevel, 
      isMultiCourse,
      enableCrossSubject,
      isInitialAssessment 
    });

    const studentContext = studentProfile ? `

STUDENT PROFILE:
- Display Name: ${studentProfile.display_name || 'Student'}
- Grade Level: ${studentProfile.grade_level || gradeLevel}
- Personality Type: ${studentProfile.personality_type || 'Not assessed'}
- Learning Profile: ${JSON.stringify(studentProfile.learning_profile || {})}
- ADHD Accommodations: ${JSON.stringify(studentProfile.accommodations || {})}
- Student Goals: ${JSON.stringify(studentGoals || {})}
- Student Interests: ${JSON.stringify(studentInterests || [])}

PARENT/TEACHER PROFILE:
${parentProfile ? `
- Teaching Style: ${parentProfile.teaching_style || 'Not specified'}
- Learning Preferences: ${parentProfile.learning_preferences || 'Not specified'}
- Educational Philosophy: ${parentProfile.educational_philosophy || 'Not specified'}

CROSS-PROFILE ALIGNMENT:
When both student and teacher share similar learning preferences (e.g., both prefer hands-on learning), 
emphasize those approaches. When preferences differ, balance both styles to create a better experience 
for teaching and learning.
` : 'No parent profile available'}

CUSTOM FRAMEWORK:
${customFramework ? `
This course uses a custom standards framework: "${customFramework.name}"
Framework includes ${customFramework.standards?.length || 0} standards from ${customFramework.region}
Legal requirements: ${JSON.stringify(customFramework.legal_requirements || {})}
` : 'Using standard framework'}

Use this comprehensive profile to personalize the assignment. Consider:
- Student's learning style, personality, interests, and goals
- Parent's teaching style and educational approach
- How to align both learning and teaching preferences
- Any ADHD accommodations needed
- Prior knowledge from completed assessments
- Progress toward framework standards
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
The following educational standards have NOT been covered yet in the selected course(s):
${uncoveredStandards.slice(0, 10).map(s => `- ${s.code}: ${s.text}${s.subject ? ` (${s.subject})` : ''}`).join('\n')}

Please design this assignment to address one or more of these uncovered standards where relevant to the topic.
Include the standard codes in the alignment section of your response.
` : '';

    // Add cross-subject integration guidance
    const crossSubjectGuidance = enableCrossSubject && weakAreas.length > 0 ? `
CROSS-SUBJECT INTEGRATION - CRITICAL:
This is a multi-course assignment with cross-subject integration enabled. The student has identified weak areas that should be incorporated:

WEAK AREAS TO ADDRESS:
${weakAreas.slice(0, 5).map(area => `- ${area.subject}: ${area.standard} (${area.description})`).join('\n')}

INSTRUCTIONS:
1. Design ONE assignment that addresses the main topic across ALL selected courses
2. Naturally weave in practice for the weak areas above where relevant
3. For example, if student is weak in fractions (math) and this is an English + Math assignment about recipes:
   - English component: Write a recipe with proper formatting
   - Math component: Calculate ingredient ratios and fractions needed for different serving sizes
   - This addresses both subjects while reinforcing the weak area (fractions)
4. Make the integration feel natural and purposeful, not forced
5. In standards_alignment_by_course, specify which standards from each course are addressed

This maximizes learning time by addressing multiple subjects and weak areas simultaneously.
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
${crossSubjectGuidance}
${pedagogyContext}

CRITICAL: Every assignment MUST include actual questions that students can answer digitally. Questions should test understanding and allow for mastery-based learning through multiple attempts.

TEACHER GUIDE REQUIREMENTS:
- All teacher guide content MUST be specific to this lesson topic and student profile
- NO GENERIC FILLER like "create a visual representation with art supplies"
- Beyond screen activities must be CONCRETE and directly related to the topic being taught
- Reference the student's specific interests, learning style, and challenges
- Provide topic-specific introduction strategies that connect to prior knowledge
- Give specific real-world examples and hands-on activities for THIS topic only`;

    const coursesDescription = targetCoursesData.map((c: any) => 
      `${c.title} (${c.subject})`
    ).join(' + ');

    const userPrompt = `Create a detailed interactive assignment for:
${isMultiCourse ? 'Courses' : 'Course'}: ${coursesDescription}
Topic: ${topic}
Grade Level: ${gradeLevel}
${isMultiCourse && enableCrossSubject ? 'MULTI-COURSE MODE: Design ONE integrated assignment that naturally addresses all selected subjects while reinforcing identified weak areas.' : ''}

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
      "options": ["Option A", "Option B", "Option C", "Option D", "I don't know"],
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
  ]${isMultiCourse ? `,
  "standards_alignment_by_course": {
    "course_id_1": [
      {"code": "STANDARD.CODE.1", "description": "How this addresses this course's standards"}
    ],
    "course_id_2": [
      {"code": "STANDARD.CODE.2", "description": "How this addresses this course's standards"}
    ]
  }` : ''}
}

Include 8-15 questions of varying difficulty. Mix question types appropriately for the subject.

CRITICAL: 
- All multiple-choice questions MUST include "I don't know" as the last option in the options array.
- The teacher_guide must be 100% specific to this lesson topic and student. No generic suggestions.`;

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
