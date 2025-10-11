import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { submissionId } = await req.json();
    
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Re-grading submission:', submissionId);

    // Fetch submission with assignment and questions
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select(`
        *,
        assignment:assignments(
          *,
          curriculum_items(body)
        )
      `)
      .eq('id', submissionId)
      .single();

    if (subError) throw subError;

    // Fetch question responses
    const { data: responses, error: respError } = await supabase
      .from('question_responses')
      .select('*')
      .eq('submission_id', submissionId);

    if (respError) throw respError;

    const questions = submission.assignment.curriculum_items.body.questions || [];
    let totalScore = 0;
    let correctCount = 0;
    const maxScore = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);

    // Re-grade each question response
    for (const response of responses) {
      const question = questions.find((q: any) => q.id === response.question_id);
      if (!question) continue;

      let newScore = 0;
      let isCorrect = false;
      let feedback = null;

      console.log(`Grading question ${response.question_id}, type: ${question.type}`);
      console.log(`Student answer: "${response.answer.value}"`);
      console.log(`Correct answer: "${question.correct_answer}"`);

      if (question.type === 'numeric') {
        const numAnswer = typeof response.answer.value === 'number' 
          ? response.answer.value 
          : parseFloat(response.answer.value);
        const correctAnswer = typeof question.correct_answer === 'number' 
          ? question.correct_answer 
          : parseFloat(question.correct_answer);
        const tolerance = question.tolerance || 0.01;
        isCorrect = Math.abs(numAnswer - correctAnswer) <= tolerance;
        newScore = isCorrect ? 1 : 0;
        console.log(`Numeric grading: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
      } else if (question.type === 'multiple_choice') {
        isCorrect = response.answer.value === question.correct_answer;
        newScore = isCorrect ? 1 : 0;
        console.log(`Multiple choice grading: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
      } else {
        // First check for exact match (case-insensitive, trimmed)
        const studentAnswer = String(response.answer.value || '').toLowerCase().trim();
        const correctAnswer = String(question.correct_answer || '').toLowerCase().trim();
        
        if (studentAnswer === correctAnswer) {
          // Exact match - give full credit without AI call
          isCorrect = true;
          newScore = 1;
          feedback = "Perfect! Your answer matches exactly.";
          console.log(`Exact match - CORRECT`);
        } else {
          // Use AI grading for open-ended questions that aren't exact matches
          console.log(`Calling AI for grading...`);
        const gradeResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: `You are an expert educator grading student responses. Your job is to:
1. Evaluate if the student demonstrates understanding of the concept, even if worded differently
2. Give credit for partial understanding and correct ideas expressed in their own words
3. Be generous but fair - recognize paraphrasing, synonyms, and alternative explanations
4. Only mark wrong if the student shows fundamental misunderstanding or provides incorrect information

Return a score between 0 and 1 where:
- 1.0 = Fully correct, demonstrates complete understanding
- 0.75-0.99 = Mostly correct, minor details missing or slight imprecision
- 0.5-0.74 = Partially correct, has the right idea but incomplete or somewhat unclear
- 0.25-0.49 = Shows some understanding but significant gaps or misconceptions
- 0-0.24 = Incorrect or shows fundamental misunderstanding` 
              },
              { 
                role: 'user', 
                content: `Question: ${question.question}
Expected Answer: ${question.correct_answer}
Student's Answer: ${response.answer.value}

Grade this response and provide:
1. A score (0-1) reflecting the student's understanding
2. Brief feedback explaining what they got right and what could be improved
3. Whether they demonstrated the core concept, even if worded differently

Be generous with partial credit. If they show understanding but use different words, that's still correct.` 
              }
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

          if (gradeResponse.ok) {
            const gradeData = await gradeResponse.json();
            const toolCall = gradeData.choices[0].message.tool_calls?.[0];
            if (toolCall) {
              const result = JSON.parse(toolCall.function.arguments);
              newScore = result.score;
              isCorrect = result.score >= 0.7;
              feedback = result.feedback;
              console.log(`AI grading result: score=${newScore}, correct=${isCorrect}`);
            } else {
              console.log(`No tool call in AI response`);
            }
          } else {
            console.log(`AI grading failed: ${gradeResponse.status}`);
          }
        }
      }

      console.log(`Final grade for question: score=${newScore}, correct=${isCorrect}`);

      // Update question response
      await supabase
        .from('question_responses')
        .update({
          is_correct: isCorrect,
          answer: {
            ...response.answer,
            ai_score: newScore,
            ai_feedback: feedback
          }
        })
        .eq('id', response.id);

      totalScore += newScore * (question.points || 1);
      if (isCorrect) correctCount++;
    }

    // Round total score to 2 decimal places
    totalScore = Math.round(totalScore * 100) / 100;

    console.log('Final totals:', { totalScore, maxScore, correctCount, questionsGraded: responses.length });

    // Update grade - try to update existing, if not found create new one
    const { error: updateGradeError } = await supabase
      .from('grades')
      .update({
        score: totalScore,
        max_score: maxScore
      })
      .eq('assignment_id', submission.assignment_id)
      .eq('student_id', submission.student_id);

    if (updateGradeError) {
      console.error('Error updating grade:', updateGradeError);
      // Try to insert if update failed (might not exist)
      await supabase
        .from('grades')
        .insert({
          assignment_id: submission.assignment_id,
          student_id: submission.student_id,
          score: totalScore,
          max_score: maxScore,
          grader: 'ai'
        });
    }

    // Update submission
    await supabase
      .from('submissions')
      .update({
        content: {
          ...submission.content,
          score: totalScore,
          maxScore: maxScore
        }
      })
      .eq('id', submissionId);

    console.log('Re-grading complete:', { totalScore, maxScore, correctCount });

    return new Response(JSON.stringify({
      success: true,
      totalScore,
      maxScore,
      correctCount,
      totalQuestions: questions.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in regrade-submission:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to regrade submission';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
