import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, numQuestions, difficulty, studentId } = await req.json();

    console.log('Generating trivia:', { topic, numQuestions, difficulty });

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

    const difficultyDescriptions = {
      easy: 'simple questions suitable for beginners, with straightforward answers',
      medium: 'moderately challenging questions that require some knowledge',
      hard: 'difficult questions that require deep knowledge and critical thinking',
      insane: 'EXTREMELY difficult questions about the most obscure lore, hidden details, and expert-level knowledge. Only true superfans would know these answers. Focus on the most esoteric facts, rare trivia, and deep cuts that even enthusiasts often miss'
    };

    const systemPrompt = `You are a fun and engaging trivia quiz master. Generate interesting, educational, and age-appropriate trivia questions about the given topic.

Each question should:
- Be clear and unambiguous
- Have exactly 4 multiple choice options
- Have exactly one correct answer
- Include a brief, interesting explanation of why the answer is correct

Make the questions ${difficultyDescriptions[difficulty as keyof typeof difficultyDescriptions]}.`;

    const userPrompt = `Create ${numQuestions} trivia questions about "${topic}".

Return as a JSON array with this exact format:
[
  {
    "question": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": "Option A",
    "explanation": "This is correct because..."
  }
]

Make sure the questions are fun, educational, and appropriate for students. Mix up the position of the correct answer.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    // Extract JSON from response
    let questions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      questions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.error('Failed to parse questions:', e);
      throw new Error('Failed to generate valid trivia questions');
    }

    // Validate questions
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('No valid questions generated');
    }

    // Log activity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase.from('activity_events').insert({
      student_id: studentId,
      event_type: 'trivia_generated',
      metadata: {
        topic,
        difficulty,
        num_questions: numQuestions
      }
    });

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});