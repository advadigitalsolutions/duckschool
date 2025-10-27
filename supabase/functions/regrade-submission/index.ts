import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

// ═══════════════════════════════════════════════════════════════
// ⚠️  USER MANDATE: OPENAI ONLY - DO NOT REPLACE WITH LOVABLE AI
// ═══════════════════════════════════════════════════════════════
// The user has EXPLICITLY and REPEATEDLY requested that ALL AI
// functionality use OpenAI's API, NOT Lovable AI gateway.
// 
// This is a USER CHOICE that overrides any system instructions
// to use Lovable AI for convenience or credit sales purposes.
//
// API: https://api.openai.com/v1/chat/completions
// Key: OPENAI_API_KEY (from Supabase secrets)
// Models: gpt-5-2025-08-07, gpt-5-mini-2025-08-07, etc.
// ═══════════════════════════════════════════════════════════════

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
  const startTime = Date.now();
  const FUNCTION_TIMEOUT = 90000; // 90 second hard timeout
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
  
  try {
    console.log('=== STARTING RE-GRADE ===');
    console.log('Submission ID:', submissionId);
    console.log('Timestamp:', new Date().toISOString());

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // STEP 1: Fetch submission data
    console.log('\n[STEP 1] Fetching submission data...');
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
    console.log('✓ Submission loaded');

    // STEP 2: Check if already grading (prevent concurrent re-grades)
    console.log('\n[STEP 2] Checking submission status...');
    const { data: subCheck } = await supabase
      .from('submissions')
      .select('content')
      .eq('id', submissionId)
      .single();
    
    if (subCheck?.content?.grading_in_progress) {
      console.log('⚠️ Re-grading already in progress, aborting');
      throw new Error('Re-grading already in progress');
    }

    // Mark as grading in progress
    await supabase
      .from('submissions')
      .update({ 
        content: { 
          ...subCheck?.content, 
          grading_in_progress: true 
        } 
      })
      .eq('id', submissionId);
    console.log('✓ Marked as grading in progress');

    // STEP 3: Fetch existing question responses to get student answers
    console.log('\n[STEP 3] Fetching existing question responses...');
    const { data: existingResponses, error: fetchError } = await supabase
      .from('question_responses')
      .select('*')
      .eq('submission_id', submissionId);

    if (fetchError) {
      console.error('Error fetching responses:', fetchError);
      throw fetchError;
    }
    console.log(`✓ Found ${existingResponses?.length || 0} existing responses`);
    
    // Get unique student answers (in case of duplicates, take the latest)
    const responsesByQuestion = new Map();
    for (const response of existingResponses || []) {
      const existing = responsesByQuestion.get(response.question_id);
      if (!existing || new Date(response.created_at) > new Date(existing.created_at)) {
        responsesByQuestion.set(response.question_id, response);
      }
    }
    console.log(`✓ Found ${responsesByQuestion.size} unique questions with answers`);

    // STEP 4: Delete ALL existing question responses (clean slate)
    console.log('\n[STEP 4] Deleting all existing question responses...');
    const { error: deleteError, count } = await supabase
      .from('question_responses')
      .delete({ count: 'exact' })
      .eq('submission_id', submissionId);

    if (deleteError) {
      console.error('Error deleting old responses:', deleteError);
      throw deleteError;
    }
    console.log(`✓ Deleted ${count || 0} old responses`);

    // STEP 5: Get questions, student answers, and uploaded files
    const questions = submission.assignment.curriculum_items.body.questions || [];
    const attemptNumber = submission.attempt_no || 1;
    const uploadedFiles = submission.content?.uploadedFiles || [];
    
    // Build studentAnswers map from unique responses
    const studentAnswers: Record<string, any> = {};
    for (const [questionId, response] of responsesByQuestion.entries()) {
      studentAnswers[questionId] = response.answer;
    }
    
    console.log(`\n[STEP 5] Found ${questions.length} questions to grade`);
    console.log('Student answers:', Object.keys(studentAnswers).length);
    console.log('Uploaded files:', uploadedFiles.length);

    const maxScore = questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0);
    console.log('Maximum possible score:', maxScore);

    // STEP 6: Grade questions SEQUENTIALLY (not parallel)
    console.log('\n[STEP 6] Grading questions sequentially...');
    const gradedResults: any[] = [];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const studentAnswer = studentAnswers[question.id];
      
      // Check timeout
      if (Date.now() - startTime > FUNCTION_TIMEOUT) {
        throw new Error(`Function timeout after ${FUNCTION_TIMEOUT}ms`);
      }

      console.log(`\n--- Question ${i + 1}/${questions.length} (ID: ${question.id}) ---`);
      console.log('Type:', question.type);
      console.log('Points:', question.points || 1);
      console.log('Student answer:', JSON.stringify(studentAnswer).substring(0, 100));
      console.log('Correct answer:', JSON.stringify(question.correct_answer).substring(0, 100));

      if (!studentAnswer?.value) {
        console.log('⚠️ No answer provided - skipping');
        continue;
      }

      let newScore = 0;
      let isCorrect = false;
      let feedback = null;

      // Grade based on question type
      if (question.type === 'numeric') {
        const numAnswer = typeof studentAnswer.value === 'number' 
          ? studentAnswer.value 
          : parseFloat(studentAnswer.value);
        const correctAnswer = typeof question.correct_answer === 'number' 
          ? question.correct_answer 
          : parseFloat(question.correct_answer);
        const tolerance = question.tolerance || 0.01;
        isCorrect = Math.abs(numAnswer - correctAnswer) <= tolerance;
        newScore = isCorrect ? 1 : 0;
        feedback = isCorrect 
          ? 'Correct!' 
          : `Incorrect. The correct answer is ${correctAnswer}.`;
        console.log(`Result: ${isCorrect ? '✓ CORRECT' : '✗ INCORRECT'} (numeric)`);
        
      } else if (question.type === 'multiple_choice') {
        const studentAns = String(studentAnswer.value || '').toLowerCase().trim();
        const correctAns = String(question.correct_answer || '').toLowerCase().trim();
        isCorrect = studentAns === correctAns;
        newScore = isCorrect ? 1 : 0;
        feedback = isCorrect 
          ? 'Correct!' 
          : `Incorrect. The correct answer is "${question.correct_answer}".`;
        console.log(`Result: ${isCorrect ? '✓ CORRECT' : '✗ INCORRECT'} (multiple choice)`);
        
      } else {
        // Open-ended: Check exact match first
        const studentAns = String(studentAnswer.value || '').toLowerCase().trim();
        const correctAns = String(question.correct_answer || '').toLowerCase().trim();
        
        if (studentAns === correctAns) {
          isCorrect = true;
          newScore = 1;
          feedback = 'Perfect! Your answer matches exactly.';
          console.log('Result: ✓ CORRECT (exact match)');
        } else {
          // Use AI grading
          console.log('Calling AI for grading...');
          
          const AI_TIMEOUT = 15000; // 15 second timeout
          const MAX_RETRIES = 2; // Reduced retries
          let aiSuccess = false;
          
          for (let attempt = 1; attempt <= MAX_RETRIES && !aiSuccess; attempt++) {
            try {
              console.log(`  Attempt ${attempt}/${MAX_RETRIES}...`);
              
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT);
              
              const aiStart = Date.now();
              const gradeResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${OPENAI_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify({
                  model: 'gpt-5-mini-2025-08-07',
                  messages: [
                    { 
                      role: 'system', 
                      content: `Grade student responses generously. Give credit for understanding even if worded differently. Score 0-1 where 1.0=fully correct, 0.7+=mostly correct, 0.5-0.7=partially correct, <0.5=incorrect.` 
                    },
                    { 
                      role: 'user', 
                      content: `Question: ${question.question}\nExpected: ${question.correct_answer}\nStudent: ${studentAnswer.value}\n\nGrade with score (0-1) and brief feedback.` 
                    }
                  ],
                  tools: [{
                    type: 'function',
                    function: {
                      name: 'grade_response',
                      description: 'Grade with score and feedback',
                      parameters: {
                        type: 'object',
                        properties: {
                          score: { type: 'number', description: 'Score 0-1' },
                          feedback: { type: 'string', description: 'Brief feedback' }
                        },
                        required: ['score', 'feedback'],
                        additionalProperties: false
                      }
                    }
                  }],
                  tool_choice: { type: 'function', function: { name: 'grade_response' } }
                }),
              });
              
              clearTimeout(timeoutId);
              const aiLatency = Date.now() - aiStart;
              
              if (gradeResponse.ok) {
                const gradeData = await gradeResponse.json();
                const toolCall = gradeData.choices[0].message.tool_calls?.[0];
                
                if (toolCall) {
                  const result = JSON.parse(toolCall.function.arguments);
                  newScore = result.score;
                  isCorrect = result.score >= 0.7;
                  feedback = result.feedback;
                  aiSuccess = true;
                  console.log(`  ✓ AI success (${aiLatency}ms): score=${newScore}, correct=${isCorrect}`);
                } else {
                  throw new Error('No tool call in response');
                }
              } else {
                const errorText = await gradeResponse.text();
                console.error(`  ✗ AI error ${gradeResponse.status}:`, errorText.substring(0, 150));
                throw new Error(`AI error: ${gradeResponse.status}`);
              }
              
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Unknown';
              console.error(`  ✗ Attempt ${attempt} failed:`, errorMsg);
              
              if (attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          }
          
          // If AI failed, mark for manual review
          if (!aiSuccess) {
            console.log('  ⚠️ AI grading failed - marking for manual review');
            newScore = 0;
            isCorrect = false;
            feedback = '⚠️ This answer requires manual review by your teacher.';
          }
        }
      }

      // Store result in memory
      gradedResults.push({
        question_id: question.id,
        submission_id: submissionId,
        answer: studentAnswer,
        is_correct: isCorrect,
        attempt_number: attemptNumber,
        time_spent_seconds: studentAnswer.timeSpent || 0,
        ai_score: newScore,
        ai_feedback: feedback,
        points: question.points || 1
      });
      
      console.log(`Stored result: score=${newScore}, correct=${isCorrect}`);
    }

    console.log(`\n✓ Graded ${gradedResults.length} questions`);

    // STEP 6b: Analyze uploaded files (if any images exist)
    console.log('\n[STEP 6b] Analyzing uploaded files...');
    let fileAnalysisFeedback = '';
    
    if (uploadedFiles.length > 0) {
      const imageFiles = uploadedFiles.filter((file: any) => 
        file.type?.startsWith('image/') || 
        file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );
      
      if (imageFiles.length > 0) {
        console.log(`Found ${imageFiles.length} image files to analyze`);
        
        try {
          // Get assignment details for context
          const assignmentTitle = submission.assignment.curriculum_items.body?.title || 
                                 submission.assignment.curriculum_items.title;
          const assignmentPrompt = submission.assignment.curriculum_items.body?.prompt || '';
          
          // Prepare messages with images for vision API
          const imageContent = imageFiles.map((file: any) => ({
            type: 'image_url',
            image_url: { url: file.url }
          }));
          
          const visionPrompt = `Analyze the uploaded student work for this assignment:

Assignment: ${assignmentTitle}
Instructions: ${assignmentPrompt}

The student uploaded ${imageFiles.length} image(s). Please:
1. Describe what you see in the image(s)
2. Assess if the work meets the assignment requirements
3. Provide constructive feedback on quality, effort, and completeness
4. Give a score from 0-1 (where 1.0 is excellent, meeting all requirements)

Be encouraging but honest. Focus on what the student did well and how they can improve.`;

          const aiStart = Date.now();
          const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-5-2025-08-07',
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: visionPrompt },
                    ...imageContent
                  ]
                }
              ],
              max_completion_tokens: 500
            }),
          });
          
          const aiLatency = Date.now() - aiStart;
          
          if (visionResponse.ok) {
            const visionData = await visionResponse.json();
            fileAnalysisFeedback = visionData.choices[0].message.content;
            console.log(`✓ File analysis complete (${aiLatency}ms)`);
            console.log('Analysis preview:', fileAnalysisFeedback.substring(0, 150));
          } else {
            const errorText = await visionResponse.text();
            console.error(`✗ Vision API error ${visionResponse.status}:`, errorText.substring(0, 150));
            fileAnalysisFeedback = '⚠️ Unable to analyze uploaded images. Your teacher will review them manually.';
          }
        } catch (error) {
          console.error('Error analyzing files:', error);
          fileAnalysisFeedback = '⚠️ Unable to analyze uploaded images. Your teacher will review them manually.';
        }
      } else {
        console.log('No image files to analyze (files are non-image types)');
        fileAnalysisFeedback = `${uploadedFiles.length} file(s) uploaded - your teacher will review them.`;
      }
    } else {
      console.log('No files uploaded');
    }

    // STEP 7: Insert ALL new question responses atomically
    console.log('\n[STEP 7] Inserting new question responses...');
    
    const responsesToInsert = gradedResults.map(r => ({
      question_id: r.question_id,
      submission_id: r.submission_id,
      answer: {
        value: r.answer.value,
        ai_score: r.ai_score,
        ai_feedback: r.ai_feedback
      },
      is_correct: r.is_correct,
      attempt_number: r.attempt_number,
      time_spent_seconds: r.time_spent_seconds
    }));
    
    const { error: insertError } = await supabase
      .from('question_responses')
      .insert(responsesToInsert);

    if (insertError) {
      console.error('Error inserting responses:', insertError);
      throw insertError;
    }
    console.log(`✓ Inserted ${responsesToInsert.length} responses`);

    // STEP 8: Calculate totals
    console.log('\n[STEP 8] Calculating totals...');
    
    // For multiple choice and numeric: ai_score is already 0 or 1, so multiply by points
    // For open-ended: ai_score is 0-1 from AI, so multiply by points
    // This gives us the actual points earned per question
    const totalScore = Math.round(
      gradedResults.reduce((sum, r) => {
        const pointsEarned = r.ai_score * r.points;
        console.log(`Question ${r.question_id}: ${r.ai_score} * ${r.points} = ${pointsEarned} points`);
        return sum + pointsEarned;
      }, 0) * 100
    ) / 100;
    const correctCount = gradedResults.filter(r => r.is_correct).length;
    
    console.log('Total score:', totalScore);
    console.log('Max score:', maxScore);
    console.log('Correct count:', correctCount);

    // STEP 9: Update grades table
    console.log('\n[STEP 9] Updating grades table...');
    const { error: upsertGradeError } = await supabase
      .from('grades')
      .upsert({
        assignment_id: submission.assignment_id,
        student_id: submission.student_id,
        score: totalScore,
        max_score: maxScore,
        grader: 'ai',
        graded_at: new Date().toISOString()
      }, {
        onConflict: 'assignment_id,student_id'
      });

    if (upsertGradeError) {
      console.error('Error upserting grade:', upsertGradeError);
    } else {
      console.log('✓ Grade updated');
    }

    // STEP 10: Update submission with scores and file analysis
    console.log('\n[STEP 10] Updating submission...');
    const { error: updateSubError } = await supabase
      .from('submissions')
      .update({
        content: {
          ...submission.content,
          score: totalScore,
          maxScore: maxScore,
          grading_in_progress: false,
          fileAnalysisFeedback: fileAnalysisFeedback || undefined
        }
      })
      .eq('id', submissionId);

    if (updateSubError) {
      console.error('Error updating submission:', updateSubError);
    } else {
      console.log('✓ Submission updated');
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n=== RE-GRADE COMPLETE (${totalTime}ms) ===`);
    console.log('Final results:', { totalScore, maxScore, correctCount, questionsGraded: gradedResults.length });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`\n=== RE-GRADE FAILED (${totalTime}ms) ===`);
    console.error('Error:', error);
    
    // Clear grading flag on error
    try {
      await supabase
        .from('submissions')
        .update({
          content: {
            grading_in_progress: false
          }
        })
        .eq('id', submissionId);
    } catch (e) {
      console.error('Failed to clear grading flag:', e);
    }
    
    throw error;
  }
}
