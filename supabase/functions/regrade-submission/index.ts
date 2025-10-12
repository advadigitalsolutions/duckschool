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
    
    // Process the re-grading synchronously so it completes
    await performRegrade(submissionId, authHeader);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Re-grading complete!' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in regrade:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to regrade';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function performRegrade(submissionId: string, authHeader: string) {
  try {
    console.log('Starting re-grade for submission:', submissionId);
    
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
    const maxScore = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);

    console.log(`Processing ${responses.length} question responses in parallel...`);

    // Grade all questions in parallel for speed
    const gradingResults = await Promise.all(
      responses.map(async (response) => {
        const question = questions.find((q: any) => q.id === response.question_id);
        if (!question) return null;

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
        // Normalize both strings for comparison (lowercase, trim)
        const studentAnswer = String(response.answer.value || '').toLowerCase().trim();
        const correctAnswer = String(question.correct_answer || '').toLowerCase().trim();
        isCorrect = studentAnswer === correctAnswer;
        newScore = isCorrect ? 1 : 0;
        console.log(`Multiple choice grading: ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);
        console.log(`  Student: "${studentAnswer}"`);
        console.log(`  Correct: "${correctAnswer}"`);
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
          console.log(`Calling AI for grading (question: ${question.question?.substring(0, 50)}...)...`);
          
          // Retry logic with exponential backoff
          let aiSuccess = false;
          let lastError = null;
          const maxRetries = 3;
          
          for (let attempt = 1; attempt <= maxRetries && !aiSuccess; attempt++) {
            try {
              console.log(`AI grading attempt ${attempt}/${maxRetries}...`);
              
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
                console.log(`AI response received:`, JSON.stringify(gradeData, null, 2));
                
                const toolCall = gradeData.choices[0].message.tool_calls?.[0];
                if (toolCall) {
                  const result = JSON.parse(toolCall.function.arguments);
                  newScore = result.score;
                  isCorrect = result.score >= 0.7;
                  feedback = result.feedback;
                  aiSuccess = true;
                  console.log(`✓ AI grading successful: score=${newScore}, correct=${isCorrect}`);
                } else {
                  throw new Error('No tool call in AI response');
                }
              } else {
                const errorText = await gradeResponse.text();
                console.error(`✗ AI API returned error (${gradeResponse.status}):`, errorText);
                
                // Check for specific error types
                if (gradeResponse.status === 429) {
                  lastError = 'Rate limit exceeded';
                } else if (gradeResponse.status === 402) {
                  lastError = 'Payment required - AI credits exhausted';
                } else {
                  lastError = `AI API error: ${gradeResponse.status}`;
                }
                throw new Error(lastError);
              }
            } catch (error) {
              lastError = error instanceof Error ? error.message : 'Unknown error';
              console.error(`✗ AI grading attempt ${attempt} failed:`, lastError);
              
              // If not the last attempt, wait before retrying (exponential backoff)
              if (attempt < maxRetries) {
                const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                console.log(`Waiting ${delayMs}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
              }
            }
          }
          
          // If all retries failed, use fallback grading
          if (!aiSuccess) {
            console.error(`⚠️ All AI grading attempts failed. Using fallback strategy.`);
            
            // Keyword matching as fallback
            const studentLower = String(response.answer.value || '').toLowerCase();
            const correctLower = String(question.correct_answer || '').toLowerCase();
            
            // Extract key words (longer than 3 chars) from correct answer
            const keyWords = correctLower
              .split(/\s+/)
              .filter(word => word.length > 3 && !['that', 'this', 'with', 'from', 'have', 'been'].includes(word));
            
            const matchedWords = keyWords.filter(word => studentLower.includes(word));
            const matchRatio = keyWords.length > 0 ? matchedWords.length / keyWords.length : 0;
            
            if (matchRatio >= 0.5) {
              // At least half the key words present - give partial credit
              newScore = 0.5;
              isCorrect = false;
              feedback = `⚠️ Unable to grade with AI (${lastError}). Based on keyword matching, your answer shows some understanding but needs manual review. Key concepts mentioned: ${matchedWords.join(', ') || 'none'}.`;
              console.log(`Using keyword fallback: ${matchRatio * 100}% match, gave 0.5 score`);
            } else {
              // Less than half matched - mark for manual review
              newScore = 0;
              isCorrect = false;
              feedback = `⚠️ Unable to grade with AI (${lastError}). This answer requires manual review by your teacher. The automated grading system could not determine the correctness.`;
              console.log(`Keyword fallback insufficient, marked for manual review`);
            }
          }
        }
      }

        console.log(`Final grade for question: score=${newScore}, correct=${isCorrect}`);

        return {
          responseId: response.id,
          newScore,
          isCorrect,
          feedback,
          points: question.points || 1,
          answer: response.answer
        };
      })
    );

    // Filter out null results and update all responses
    const validResults = gradingResults.filter(r => r !== null);
    
    console.log(`Updating ${validResults.length} question responses...`);
    
    // First, delete any duplicate question responses (keep only the one we're updating)
    for (const result of validResults) {
      const question = questions.find((q: any) => {
        const resp = responses.find(r => r.id === result.responseId);
        return resp && q.id === resp.question_id;
      });
      
      if (question) {
        const resp = responses.find(r => r.id === result.responseId);
        // Delete all other responses for this question in this submission
        await supabase
          .from('question_responses')
          .delete()
          .eq('submission_id', submissionId)
          .eq('question_id', resp.question_id)
          .neq('id', result.responseId);
      }
    }
    
    // Update all question responses in parallel
    const updateResults = await Promise.all(
      validResults.map(result => 
        supabase
          .from('question_responses')
          .update({
            is_correct: result.isCorrect,
            answer: {
              ...result.answer,
              ai_score: result.newScore,
              ai_feedback: result.feedback
            }
          })
          .eq('id', result.responseId)
      )
    );
    
    // Log any update errors
    updateResults.forEach((result, idx) => {
      if (result.error) {
        console.error(`Failed to update response ${validResults[idx].responseId}:`, result.error);
      }
    });

    // Calculate totals
    const totalScore = Math.round(
      validResults.reduce((sum, r) => sum + (r.newScore * r.points), 0) * 100
    ) / 100;
    const correctCount = validResults.filter(r => r.isCorrect).length;

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
  } catch (error) {
    console.error('Error in regrade-submission:', error);
    throw error;
  }
}
