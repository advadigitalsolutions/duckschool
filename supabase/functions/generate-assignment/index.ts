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
      approachOverride,
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
    
    // If no approach override provided at assignment level, check course level
    let effectiveApproachOverride = approachOverride;
    if (!effectiveApproachOverride && targetCourseIds.length > 0) {
      // Check first course for course-level override
      const { data: courseData } = await supabase
        .from('courses')
        .select('description')
        .eq('id', targetCourseIds[0])
        .single();
      
      if (courseData?.description && courseData.description.startsWith('APPROACH_OVERRIDE:')) {
        effectiveApproachOverride = courseData.description.replace('APPROACH_OVERRIDE:', '').trim();
        console.log('Using course-level approach override:', effectiveApproachOverride);
      }
    }

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

    // Import weak area analysis service
    const { analyzeWeakAreas, planCrossSubjectIntegration } = await import('../_shared/weak-area-analyzer.ts');

    // Get student's weak areas for cross-subject integration
    let weakAreas: any[] = [];
    let integrationPlan: any[] = [];
    
    if (enableCrossSubject && isMultiCourse) {
      weakAreas = await analyzeWeakAreas(supabase, studentProfile.id, targetCourseIds);
      
      integrationPlan = planCrossSubjectIntegration(
        weakAreas,
        targetCoursesData.map((c: any) => ({ 
          id: c.id, 
          subject: c.subject, 
          title: c.title 
        })),
        topic
      );

      console.log('Weak areas analysis:', {
        total_weak_areas: weakAreas.length,
        top_priorities: weakAreas.slice(0, 5).map(w => ({
          standard: w.standard_code,
          subject: w.subject,
          priority: w.priority_score
        })),
        integration_opportunities: integrationPlan.length,
        high_quality_integrations: integrationPlan.filter(i => i.naturalness_rating === 'high').length
      });
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
    
    // Build courses description before using it
    const coursesDescription = targetCoursesData.map((c: any) => 
      `${c.title} (${c.subject})`
    ).join(' + ');
    
    // Add uncovered standards guidance
    const standardsGuidance = uncoveredStandards.length > 0 ? `
PRIORITY STANDARDS TO ADDRESS:
The following educational standards have NOT been covered yet in the selected course(s):
${uncoveredStandards.slice(0, 10).map(s => `- ${s.code}: ${s.text}${s.subject ? ` (${s.subject})` : ''}`).join('\n')}

Please design this assignment to address one or more of these uncovered standards where relevant to the topic.
Include the standard codes in the alignment section of your response.
` : '';

    // Add cross-subject integration guidance with quality scoring
    const crossSubjectGuidance = enableCrossSubject && integrationPlan.length > 0 ? `
CROSS-SUBJECT INTEGRATION - CRITICAL:
This is a multi-course assignment with cross-subject integration enabled. Advanced analysis has identified high-quality opportunities to naturally incorporate weak areas:

TOP PRIORITY INTEGRATION OPPORTUNITIES (sorted by quality):
${integrationPlan.slice(0, 5).map((integration, idx) => `
${idx + 1}. WEAK AREA: ${integration.weak_area.subject} - ${integration.weak_area.standard_code}
   Mastery: ${integration.weak_area.mastery_level}% | Priority Score: ${integration.weak_area.priority_score}
   Quality: ${integration.quality_score}/100 | Naturalness: ${integration.naturalness_rating.toUpperCase()}
   
   INTEGRATION SUGGESTIONS:
   ${integration.integration_suggestions.map((s: string) => `   • ${s}`).join('\n')}
   
   TARGET COURSES: ${integration.target_courses.join(', ')}
`).join('\n')}

INTEGRATION INSTRUCTIONS:
1. Design ONE cohesive assignment that addresses the main topic "${topic}" across ALL selected courses
2. Use the integration suggestions above to naturally weave in weak area practice
3. Focus on HIGH and MEDIUM naturalness integrations - they will feel most authentic to students
4. Make connections explicit but not forced (e.g., "As we analyze this historical data, we'll also practice the fraction operations we've been working on")
5. Include standards_alignment_by_course showing which standards from each course are addressed
6. Explain in teacher_guide how the cross-subject integration strengthens learning

QUALITY METRICS:
- ${integrationPlan.filter(i => i.naturalness_rating === 'high').length} high-quality integrations available
- ${integrationPlan.filter(i => i.naturalness_rating === 'medium').length} medium-quality integrations available
- Average integration quality: ${Math.round(integrationPlan.reduce((sum, i) => sum + i.quality_score, 0) / integrationPlan.length)}/100

This maximizes learning time by addressing multiple subjects and targeted weak areas simultaneously while maintaining natural flow.
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

CRITICAL CONTENT RULES:
You are generating lessons for: ${coursesDescription} (Grade ${gradeLevel})

STRICT REQUIREMENTS:
1. Use ONLY standards that belong to the target course's grade band and jurisdiction
2. DO NOT include content outside the course's standard scope
3. DO NOT include banned terms for this course/grade band
4. Always include at least one valid standard code tied to the objective
5. Be concise and age-appropriate
6. If a prerequisite gap is detected, create a clearly labeled Bridge Support (≤10 min) separate from the core lesson

If you receive a regenerate_with_fixes block, you MUST:
- Use ONLY the allowed standard code prefixes provided
- Remove ALL banned terms from core content
- Move any prerequisite review to a separate "bridge_support" section
- Ensure every standard code is valid and in-scope

CRITICAL: Every assignment MUST include actual questions that students can answer digitally. Questions should test understanding and allow for mastery-based learning through multiple attempts.

RESOURCE GUIDANCE - IMPORTANT:
DO NOT include specific external resource URLs or titles (like "Khan Academy video on X" or "YouTube: channel name").
Instead, provide GENERAL guidance on where students should search:
- Suggest reputable educational platforms (general names only like "Khan Academy", "YouTube educational channels")
- Include relevant SEARCH KEYWORDS students should use
- Specify TYPES of resources to look for (videos, articles, interactive tutorials)
- Let students discover and validate their own resources through guided research

TEACHER GUIDE REQUIREMENTS:
- All teacher guide content MUST be specific to this lesson topic and student profile
- NO GENERIC FILLER like "create a visual representation with art supplies"
- Beyond screen activities must be CONCRETE and directly related to the topic being taught
- Reference the student's specific interests, learning style, and challenges
- Provide topic-specific introduction strategies that connect to prior knowledge
- Give specific real-world examples and hands-on activities for THIS topic only`;

    const approachOverrideContext = effectiveApproachOverride 
      ? `\n🎯 CRITICAL REQUIREMENT - STUDENT'S PREFERRED APPROACH (HIGHEST PRIORITY):
"${effectiveApproachOverride}"

THIS IS A DIRECT REQUEST FROM THE STUDENT. You MUST respect this approach and resource preference above all other learning style recommendations. If the student wants Khan Academy, use Khan Academy. If they want computer-based only, keep it computer-based. Do not force kinesthetic activities, props, costumes, or physical materials if they've specified otherwise.\n`
      : '';

    const userPrompt = `${approachOverrideContext}Create a detailed interactive assignment for:
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
  "research_guidance": {
    "suggested_sites": [
      "Khan Academy (search for: 'specific topic keywords')",
      "YouTube educational channels (search: 'topic name')",
      "Educational website name (search for: 'keywords')"
    ],
    "search_keywords": ["keyword1", "keyword2", "keyword3"],
    "minimum_resources": 2,
    "resource_types_needed": ["video", "article"]
  },
  "key_concepts": [
    {
      "concept": "Concept Name",
      "what_to_understand": "Concrete description of what understanding this concept looks like"
    }
  ],
  "discussion_prompts": [
    "Open-ended question using 'why' or 'how' that checks understanding",
    "Another Socratic question that requires synthesis"
  ],
  "guided_practice": [
    {
      "task": "Concrete hands-on task that applies the key concepts",
      "scaffolding": [
        "Hint 1 - a nudge in the right direction",
        "Hint 2 - another helpful pointer",
        "Hint 3 - scaffold without giving away the answer"
      ],
      "success_criteria": "What a successful completion looks like"
    }
  ],
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
    let generatedContent = JSON.parse(data.choices[0].message.content);
    
    console.log('Generated assignment (pre-validation):', generatedContent.title);

    // CURRICULUM GATE VALIDATION LOOP
    const MAX_ATTEMPTS = 3;
    let attempt = 0;
    let validatedLesson = null;
    let gateResult = null;

    while (attempt < MAX_ATTEMPTS && !validatedLesson) {
      attempt++;
      console.log(`🔍 Validation attempt ${attempt}/${MAX_ATTEMPTS}`);
      
      // Build validation context
      const validationContext = {
        course_key: targetCoursesData[0] ? `CA:${targetCoursesData[0].title}:${targetCoursesData[0].grade_level}` : undefined,
        class_name: targetCoursesData[0]?.title || 'Course',
        state: "CA",
        grade_band: gradeLevel,
        subject: targetCoursesData[0]?.subject || 'General',
        mode: "generation"
      };

      // Call curriculum gate
      const gateResponse = await fetch(`${supabaseUrl}/functions/v1/curriculum-gate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_json: generatedContent,
          context: validationContext
        })
      });

      if (!gateResponse.ok) {
        console.error('❌ Gate validation failed:', await gateResponse.text());
        break; // Proceed without validation if gate fails
      }

      gateResult = await gateResponse.json();

      if (gateResult.approval_status === "approved" || gateResult.approval_status === "corrected") {
        validatedLesson = gateResult.validated_lesson;
        console.log(`✅ Validation passed on attempt ${attempt} (${gateResult.approval_status})`);
        
        // Log validation result
        if (targetCoursesData[0]?.id) {
          await supabase.from('curriculum_validation_log').insert({
            entity_type: 'assignment',
            entity_id: null, // Will be updated when assignment is created
            validation_result: gateResult
          });
        }
        break;
      }

      if (gateResult.approval_status === "rejected" && gateResult.regenerate_with_fixes && attempt < MAX_ATTEMPTS) {
        console.log(`❌ Validation failed, regenerating with fixes...`);
        
        // Add regeneration instructions to system prompt
        const fixesInstruction = `
CRITICAL: The previous generation was rejected. You MUST fix these issues:

${gateResult.regenerate_with_fixes.reason}

REQUIRED FIXES:
${gateResult.regenerate_with_fixes.notes.map((n: string) => `- ${n}`).join('\n')}

ALLOWED STANDARD CODES: ${gateResult.regenerate_with_fixes.required_scope.allow_prefixes.join(", ")}
BANNED TERMS IN CORE CONTENT: ${gateResult.regenerate_with_fixes.required_scope.ban_terms.join(", ")}

Follow these constraints STRICTLY. Do not include any banned codes or terms in core content. You may use banned terms only in bridge_support if needed.
`;
        
        // Regenerate with enhanced prompt
        const retryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: fixesInstruction + '\n\n' + systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' }
          }),
        });

        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          generatedContent = JSON.parse(retryData.choices[0].message.content);
          console.log(`🔄 Regenerated assignment for attempt ${attempt + 1}`);
          continue;
        }
      }

      break; // No more retries or fixes available
    }

    // Use validated content if available, otherwise use original
    const finalContent = validatedLesson || generatedContent;
    
    if (!validatedLesson && gateResult?.findings?.length > 0) {
      console.warn('⚠️ Proceeding with unvalidated content after 3 attempts:', gateResult.findings);
    }

    // Return both content and validation metadata for audit trail
    const responseData = {
      ...finalContent,
      _validation_metadata: gateResult ? {
        approval_status: gateResult.approval_status,
        alignment_confidence: gateResult.alignment_confidence,
        findings: gateResult.findings || [],
        corrections_applied: gateResult.corrections_applied || [],
        course_key_matched: gateResult.course_key_matched,
        validated_at: gateResult.validated_at,
        rigor_analysis: gateResult.rigor_analysis
      } : null
    };

    return new Response(JSON.stringify(responseData), {
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
