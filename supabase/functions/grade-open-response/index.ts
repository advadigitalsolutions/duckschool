import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, studentAnswer, correctAnswer, maxPoints } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Grading open response:', { question, studentAnswer, correctAnswer });

    const systemPrompt = `You are an expert educator grading student responses. Your job is to:
1. Evaluate if the student demonstrates understanding of the concept, even if worded differently
2. Give credit for partial understanding and correct ideas expressed in their own words
3. Be generous but fair - recognize paraphrasing, synonyms, and alternative explanations
4. Only mark wrong if the student shows fundamental misunderstanding or provides incorrect information

Return a score between 0 and 1 where:
- 1.0 = Fully correct, demonstrates complete understanding
- 0.75-0.99 = Mostly correct, minor details missing or slight imprecision
- 0.5-0.74 = Partially correct, has the right idea but incomplete or somewhat unclear
- 0.25-0.49 = Shows some understanding but significant gaps or misconceptions
- 0-0.24 = Incorrect or shows fundamental misunderstanding`;

    const userPrompt = `Question: ${question}
Expected Answer: ${correctAnswer}
Student's Answer: ${studentAnswer}

Grade this response and provide:
1. A score (0-1) reflecting the student's understanding
2. Brief feedback explaining what they got right and what could be improved
3. Whether they demonstrated the core concept, even if worded differently

Be generous with partial credit. If they show understanding but use different words, that's still correct.`;

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
        tools: [{
          type: 'function',
          function: {
            name: 'grade_response',
            description: 'Grade a student response with score and feedback',
            parameters: {
              type: 'object',
              properties: {
                score: {
                  type: 'number',
                  description: 'Score between 0 and 1 reflecting understanding'
                },
                feedback: {
                  type: 'string',
                  description: 'Brief constructive feedback on the response'
                },
                has_core_understanding: {
                  type: 'boolean',
                  description: 'Whether student demonstrates the core concept'
                }
              },
              required: ['score', 'feedback', 'has_core_understanding'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'grade_response' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Convert score to points based on max points for the question
    const pointsEarned = Math.round(result.score * maxPoints * 100) / 100;
    
    console.log('Grading result:', { ...result, pointsEarned });

    return new Response(JSON.stringify({
      score: result.score,
      pointsEarned,
      maxPoints,
      feedback: result.feedback,
      has_core_understanding: result.has_core_understanding
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in grade-open-response:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to grade response';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
