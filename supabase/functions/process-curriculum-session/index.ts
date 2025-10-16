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
    const { studentId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) throw new Error('Unauthorized');

    // Get student and planning session
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (!student) throw new Error('Student not found');

    const { data: session } = await supabase
      .from('curriculum_planning_sessions')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (!session) throw new Error('Planning session not found');

    // Extract comprehensive data from conversation history
    const conversationText = (session.conversation_history as any[])
      .map((msg: any) => msg.content)
      .join(' ');

    const extractedData = extractComprehensiveData(conversationText.toLowerCase());

    // Use AI to generate a comprehensive learning profile from the conversation
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational psychologist. Extract a comprehensive learning profile from the parent-educator conversation.'
          },
          {
            role: 'user',
            content: `Analyze this conversation and create a detailed learning profile:\n\n${conversationText}\n\nExtract: pedagogical approach, learning style, interests, challenges, strengths, goals, and accommodations needed.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_learning_profile',
            description: 'Create a comprehensive learning profile',
            parameters: {
              type: 'object',
              properties: {
                pedagogicalApproach: { type: 'string', description: 'Recommended teaching approach' },
                interests: { type: 'array', items: { type: 'string' }, description: 'Student interests' },
                strengths: { type: 'array', items: { type: 'string' }, description: 'Academic and personal strengths' },
                challenges: { type: 'array', items: { type: 'string' }, description: 'Learning challenges or conditions' },
                goals: { type: 'string', description: 'Educational and career goals' },
                accommodations: { type: 'array', items: { type: 'string' }, description: 'Needed accommodations' },
                motivators: { type: 'array', items: { type: 'string' }, description: 'What motivates the student' }
              },
              required: ['pedagogicalApproach', 'interests', 'strengths', 'goals'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_learning_profile' } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    const aiProfile = toolCall ? JSON.parse(toolCall.function.arguments) : {};
    
    // Merge AI-extracted data with keyword extraction fallback
    const mergedProfile = {
      ...extractedData.learningProfile,
      ...aiProfile,
      interests: [...new Set([...(aiProfile.interests || []), ...(extractedData.learningProfile.interests || [])])],
      strengths: [...new Set([...(aiProfile.strengths || []), ...(extractedData.learningProfile.strengths || [])])],
      challenges: [...new Set([...(aiProfile.challenges || []), ...(extractedData.learningProfile.challenges || [])])]
    };

    // Update student with extracted administrator assessment (separate from student's self-assessment)
    await supabase
      .from('students')
      .update({
        administrator_assessment: mergedProfile,
        accommodations: extractedData.accommodations,
        display_name: student.name
      })
      .eq('id', studentId);

    // Delete old generic course
    await supabase
      .from('courses')
      .delete()
      .eq('student_id', studentId);

    // Create proper subject-specific courses
    const gradeLevel = student.grade_level || '12th grade';
    const coreSubjects = [
      { name: 'Mathematics', description: 'Advanced mathematics including Pre-Calculus and Calculus' },
      { name: 'English Language Arts', description: 'Literature, composition, and critical analysis' },
      { name: 'Science', description: 'Physics, Chemistry, or Biology with lab components' },
      { name: 'History & Social Science', description: 'World history, government, and economics' },
      { name: 'Computer Science', description: 'Programming, algorithms, and software development' }
    ];

    // Add extracurriculars
    const allSubjects = [...coreSubjects];
    if (extractedData.extracurriculars.length > 0) {
      extractedData.extracurriculars.forEach((extra: string) => {
        allSubjects.push({
          name: extra.charAt(0).toUpperCase() + extra.slice(1),
          description: `Extracurricular focus on ${extra}`
        });
      });
    }

    // Create courses and assessments
    for (const subject of allSubjects) {
      const { data: course } = await supabase
        .from('courses')
        .insert({
          student_id: studentId,
          title: `${gradeLevel} ${subject.name}`,
          subject: subject.name,
          grade_level: gradeLevel,
          description: subject.description,
          standards_scope: ['Common Core']
        })
        .select()
        .single();

      if (!course) continue;

      // Generate initial assessment for this course
      try {
        const assignmentResponse = await fetch(`${supabaseUrl}/functions/v1/generate-assignment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseTitle: course.title,
            courseSubject: subject.name,
            topic: `Initial ${subject.name} Assessment`,
            gradeLevel: gradeLevel,
            standards: ['Common Core'],
            studentProfile: {
              display_name: student.name,
              learning_profile: mergedProfile,
              accommodations: extractedData.accommodations,
              goals: mergedProfile.goals
            },
            isInitialAssessment: true
          })
        });

        const assignmentContent = await assignmentResponse.json();

        // Create curriculum item
        const { data: curriculumItem } = await supabase
          .from('curriculum_items')
          .insert({
            course_id: course.id,
            title: `Initial ${subject.name} Assessment`,
            type: 'assignment',
            body: assignmentContent,
            est_minutes: assignmentContent.estimated_minutes || 60
          })
          .select()
          .single();

        // Create assignment
        if (curriculumItem) {
          await supabase
            .from('assignments')
            .insert({
              curriculum_item_id: curriculumItem.id,
              status: 'assigned',
              max_attempts: 3,
              rubric: assignmentContent.rubric || []
            });
        }
      } catch (error) {
        console.error(`Error creating assessment for ${subject.name}:`, error);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Student profile and courses updated successfully',
      coursesCreated: allSubjects.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing session:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function extractComprehensiveData(text: string) {
  const learningProfile: any = {
    pedagogicalApproach: '',
    learningStyle: '',
    interests: [],
    challenges: [],
    strengths: [],
    preferredEnvironment: '',
    motivators: [],
    communicationStyle: '',
    educationalBackground: '',
    notes: ''
  };

  const accommodations: any = {
    conditions: [],
    strategies: [],
    tools: [],
    notes: ''
  };

  const extracurriculars: string[] = [];

  // Extract accommodations
  if (text.includes('adhd')) {
    accommodations.conditions.push('ADHD');
    learningProfile.challenges.push('ADHD');
  }
  if (text.includes('dyslexia')) {
    accommodations.conditions.push('Dyslexia');
    learningProfile.challenges.push('Dyslexia');
  }
  if (text.includes('anxiety') || text.includes('social anxiety')) {
    accommodations.conditions.push('Social Anxiety');
    learningProfile.challenges.push('Social Anxiety');
  }
  if (text.includes('fatigue')) {
    accommodations.conditions.push('Fatigue');
    learningProfile.challenges.push('Fatigue/Energy Management');
  }

  // Extract strategies
  if (text.includes('visual timer')) accommodations.strategies.push('Visual timers');
  if (text.includes('quiet room') || text.includes('quiet space')) accommodations.strategies.push('Quiet environment');
  if (text.includes('small tasks') || text.includes('building momentum')) accommodations.strategies.push('Breaking tasks into smaller steps');
  if (text.includes('talking through') || text.includes('talking out')) accommodations.strategies.push('Verbal processing and discussion');
  if (text.includes('hands-on')) accommodations.strategies.push('Hands-on activities');

  // Extract interests and strengths
  if (text.includes('game developer') || text.includes('game development')) {
    learningProfile.interests.push('Game development');
    learningProfile.strengths.push('Game development');
    extracurriculars.push('Game Development');
  }
  if (text.includes('self taught') || text.includes('self-taught')) {
    learningProfile.strengths.push('Self-directed learning');
  }
  if (text.includes('introvert')) {
    learningProfile.communicationStyle = 'Introverted - prefers independent work';
  }

  // Extract pedagogical approach
  if (text.includes('project-based') || text.includes('project based')) {
    learningProfile.pedagogicalApproach = 'Project-based learning with rigorous academics';
  }
  if (text.includes('stem-focused') || text.includes('stem focused') || text.includes('rigorous')) {
    learningProfile.preferredEnvironment = 'STEM-focused, rigorous academic environment';
  }

  // Extract motivators
  if (text.includes('challenged') || text.includes('rigorous')) {
    learningProfile.motivators.push('Intellectual challenge');
  }
  if (text.includes('autonomy') || text.includes('creative')) {
    learningProfile.motivators.push('Creative autonomy');
  }

  // Extract educational background
  const schoolTypes = ['montessori', 'catholic school', 'arts school', 'public school', 'private school', 'unschool'];
  const mentionedSchools = schoolTypes.filter(school => text.includes(school));
  if (mentionedSchools.length > 0) {
    learningProfile.educationalBackground = mentionedSchools.join(', ');
  }

  // Extract goals
  if (text.includes('engineering') || text.includes('college')) {
    learningProfile.goals = 'Engineering college preparation, targeting UC Berkeley and California schools';
  }

  return {
    learningProfile,
    accommodations,
    extracurriculars
  };
}
