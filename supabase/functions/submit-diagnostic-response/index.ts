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

    const { 
      assessmentId, 
      studentId,
      questionNumber,
      topic,
      difficulty,
      questionData,
      studentAnswer,
      correctAnswer,
      timeSpent,
      explanation
    } = await req.json();

    if (!assessmentId || !studentId || !questionData) {
      throw new Error('Missing required fields');
    }

    const isCorrect = studentAnswer === correctAnswer;
    console.log('Processing response:', { assessmentId, questionNumber, isCorrect });

    // Generate encouraging AI feedback
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    let aiFeedback = '';
    
    if (OPENAI_API_KEY) {
      try {
        const feedbackPrompt = isCorrect 
          ? `Generate brief, encouraging feedback for a student who answered correctly. Keep it under 20 words and celebrate their success without being patronizing.`
          : `Generate brief, supportive feedback for a student who answered incorrectly. Focus on learning opportunity, not failure. Keep it under 30 words and include the explanation: ${explanation}`;

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5-mini-2025-08-07',
            messages: [
              { role: 'system', content: 'You are an encouraging tutor providing brief, positive feedback.' },
              { role: 'user', content: feedbackPrompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiFeedback = aiData.choices[0]?.message?.content || '';
        }
      } catch (err) {
        console.error('Error generating feedback:', err);
      }
    }

    // Calculate mastery delta using simplified IRT
    const masteryDelta = isCorrect 
      ? (1 - difficulty) * 0.15  // Increase mastery more for harder correct answers
      : -(difficulty) * 0.15;     // Decrease mastery more for easier incorrect answers

    // Save the response
    const { error: insertError } = await supabaseClient
      .from('diagnostic_question_responses')
      .insert({
        assessment_id: assessmentId,
        student_id: studentId,
        question_number: questionNumber,
        phase: 'deep_dive',
        standard_code: topic,
        difficulty_level: difficulty,
        question_data: questionData,
        student_response: { answer: studentAnswer },
        is_correct: isCorrect,
        time_spent_seconds: timeSpent,
        ai_feedback: aiFeedback,
        mastery_delta: masteryDelta
      });

    if (insertError) {
      console.error('Error saving response:', insertError);
      throw insertError;
    }

    // Update mastery estimates
    const { data: assessment } = await supabaseClient
      .from('diagnostic_assessments')
      .select('mastery_estimates, questions_asked')
      .eq('id', assessmentId)
      .single();

    const currentEstimates = assessment?.mastery_estimates || {};
    const currentMastery = (currentEstimates[topic] as number) || 0.5;
    const newMastery = Math.max(0, Math.min(1, currentMastery + masteryDelta));
    
    currentEstimates[topic] = newMastery;

    const { error: updateError } = await supabaseClient
      .from('diagnostic_assessments')
      .update({
        mastery_estimates: currentEstimates,
        questions_asked: (assessment?.questions_asked || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('Error updating assessment:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        isCorrect,
        feedback: aiFeedback,
        newMastery,
        masteryDelta
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-diagnostic-response:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});