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
    const { courseTitle, courseSubject, topic, gradeLevel, standards, studentProfile, isInitialAssessment } = await req.json();
    
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

${studentContext}
${assessmentContext}

CRITICAL: Every assignment MUST include actual questions that students can answer digitally. Questions should test understanding and allow for mastery-based learning through multiple attempts.`;

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
  "adhd_accommodations": ["accommodation 1", "accommodation 2"]
}

Include 8-15 questions of varying difficulty. Mix question types appropriately for the subject.`;

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
