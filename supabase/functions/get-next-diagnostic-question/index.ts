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

    // Check if we have a question batch cached
    const questionBatch = assessment.question_batch || [];
    if (questionBatch.length > 0) {
      // Return the next question from the batch
      const nextQuestion = questionBatch[0];
      const remainingBatch = questionBatch.slice(1);
      
      // Update the batch
      await supabaseClient
        .from('diagnostic_assessments')
        .update({ question_batch: remainingBatch })
        .eq('id', assessmentId);

      console.log('Returning cached question, remaining in batch:', remainingBatch.length);
      return new Response(
        JSON.stringify(nextQuestion),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    console.log('Generating new batch of questions...');

    // Generate a batch of 4 questions (targeting different topics for variety)
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Find topics sorted by confidence (lowest confidence = most uncertainty = need more questions)
    const topicsByConfidence = Object.entries(masteryEstimates)
      .map(([topic, mastery]) => ({
        topic,
        mastery: mastery as number,
        confidence: Math.abs((mastery as number) - 0.5)
      }))
      .sort((a, b) => a.confidence - b.confidence);

    // If no topics yet, use warmup data
    if (topicsByConfidence.length === 0) {
      const warmupTopics = Object.keys(assessment.warmup_data || {});
      warmupTopics.forEach(topic => {
        topicsByConfidence.push({
          topic,
          mastery: 0.5,
          confidence: 0
        });
      });
    }

    // Select 4 topics to generate questions for (or fewer if we don't have enough)
    const targetTopics = topicsByConfidence.slice(0, Math.min(4, topicsByConfidence.length));
    
    const subjectContext = assessment.subject === 'Home Economics' || assessment.subject === 'Life Skills'
      ? 'real-world practical life skills like cooking, budgeting, household management, nutrition, sewing, cleaning, time management, etc.'
      : assessment.subject;

    const batchPrompt = `Generate ${targetTopics.length} ${subjectContext} questions for a diagnostic assessment. 

For each question, target these topics and difficulty levels:
${targetTopics.map((t, i) => `${i + 1}. Topic: "${t.topic}", Difficulty: ${t.mastery.toFixed(2)}`).join('\n')}

Each question should:
- Test understanding of the specified topic in the context of ${assessment.subject}
- Be appropriate for ${assessment.grade_level || 'middle school'} level
- Be practical and relatable to real-life situations
- Have a clear correct answer
- Include 4 multiple choice options (A, B, C, D)
- Be engaging, friendly, and non-intimidating
- Focus on practical knowledge students would actually use in daily life

Return ${targetTopics.length} questions.`;

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
          { role: 'user', content: batchPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_questions',
            description: 'Generate multiple diagnostic questions',
            parameters: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  items: {
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
              },
              required: ['questions']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_questions' } }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    const batchData = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!batchData || !batchData.questions || batchData.questions.length === 0) {
      throw new Error('Failed to generate question batch');
    }

    // Format the questions with metadata
    const formattedBatch = batchData.questions.map((q: any, index: number) => ({
      complete: false,
      questionNumber: questionsAsked + index + 1,
      topic: targetTopics[index]?.topic || 'General',
      difficulty: targetTopics[index]?.mastery || 0.5,
      question: q.question,
      options: q.options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation
    }));

    // Return first question, cache the rest
    const firstQuestion = formattedBatch[0];
    const remainingBatch = formattedBatch.slice(1);

    await supabaseClient
      .from('diagnostic_assessments')
      .update({ question_batch: remainingBatch })
      .eq('id', assessmentId);

    console.log('Generated batch of', formattedBatch.length, 'questions, cached', remainingBatch.length);

    return new Response(
      JSON.stringify(firstQuestion),
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