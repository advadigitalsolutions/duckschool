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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { assessmentId } = await req.json();

    if (!assessmentId) {
      throw new Error('Assessment ID is required');
    }

    console.log('Getting next question for assessment:', assessmentId);

    // Get the assessment with current mastery estimates
    const { data: assessment, error: fetchError } = await supabaseClient
      .from('diagnostic_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (fetchError) throw fetchError;

    // Get previous responses
    const { data: responses } = await supabaseClient
      .from('diagnostic_question_responses')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false });

    const questionsAsked = responses?.length || 0;
    const masteryEstimates = assessment.mastery_estimates || {};

    // Check if we should complete the assessment
    // Complete after 10-15 questions or when confidence is high across all topics
    const shouldComplete = questionsAsked >= 15 || 
      (questionsAsked >= 10 && Object.values(masteryEstimates).every((m: any) => {
        const confidence = Math.abs(m - 0.5);
        return confidence > 0.3; // High confidence in mastery level
      }));

    if (shouldComplete) {
      return new Response(
        JSON.stringify({ 
          complete: true,
          questionsAsked,
          masteryEstimates
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find topic with lowest confidence (closest to 0.5)
    let targetTopic = null;
    let lowestConfidence = 1;
    
    for (const [topic, mastery] of Object.entries(masteryEstimates)) {
      const confidence = Math.abs((mastery as number) - 0.5);
      if (confidence < lowestConfidence) {
        lowestConfidence = confidence;
        targetTopic = topic;
      }
    }

    // If no target topic, pick one from warmup data
    if (!targetTopic) {
      const warmupTopics = Object.keys(assessment.warmup_data || {});
      targetTopic = warmupTopics[Math.floor(Math.random() * warmupTopics.length)] || 'General';
    }

    // Generate question using OpenAI
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const currentMastery = (masteryEstimates[targetTopic] as number) || 0.5;
    
    const prompt = `Generate a ${assessment.subject} question for topic "${targetTopic}" at difficulty level ${currentMastery.toFixed(2)}.

The question should:
- Test understanding of ${targetTopic}
- Be appropriate for ${assessment.grade_level || 'middle school'} level
- Have a clear correct answer
- Include 4 multiple choice options (A, B, C, D)
- Be engaging and non-intimidating

Return ONLY the question data, no other text.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'You are an educational assessment expert. Generate clear, appropriate questions.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_question',
            description: 'Generate a diagnostic question',
            parameters: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: {
                  type: 'object',
                  properties: {
                    A: { type: 'string' },
                    B: { type: 'string' },
                    C: { type: 'string' },
                    D: { type: 'string' }
                  },
                  required: ['A', 'B', 'C', 'D']
                },
                correct_answer: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
                explanation: { type: 'string' }
              },
              required: ['question', 'options', 'correct_answer', 'explanation']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_question' } }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    const questionData = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!questionData) {
      throw new Error('Failed to generate question');
    }

    return new Response(
      JSON.stringify({ 
        complete: false,
        questionNumber: questionsAsked + 1,
        topic: targetTopic,
        difficulty: currentMastery,
        question: questionData.question,
        options: questionData.options,
        correctAnswer: questionData.correct_answer,
        explanation: questionData.explanation
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-next-diagnostic-question:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});