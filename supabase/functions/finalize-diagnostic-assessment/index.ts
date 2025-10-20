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

    console.log('Finalizing diagnostic assessment:', assessmentId);

    // Get the assessment with all data
    const { data: assessment, error: fetchError } = await supabaseClient
      .from('diagnostic_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (fetchError) throw fetchError;

    // Get all responses
    const { data: responses } = await supabaseClient
      .from('diagnostic_question_responses')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('question_number', { ascending: true });

    const masteryEstimates = assessment.mastery_estimates || {};
    
    // Categorize topics into mastered, in-progress, and needs-work
    const mastered = [];
    const inProgress = [];
    const needsWork = [];

    for (const [topic, mastery] of Object.entries(masteryEstimates)) {
      if ((mastery as number) >= 0.7) {
        mastered.push({ topic, mastery });
      } else if ((mastery as number) >= 0.4) {
        inProgress.push({ topic, mastery });
      } else {
        needsWork.push({ topic, mastery });
      }
    }

    // Calculate overall metrics
    const totalQuestions = responses?.length || 0;
    const correctAnswers = responses?.filter(r => r.is_correct).length || 0;
    const accuracyRate = totalQuestions > 0 ? (correctAnswers / totalQuestions) : 0;
    const averageMastery = Object.values(masteryEstimates).reduce((sum: number, m) => sum + (m as number), 0) / Object.values(masteryEstimates).length;

    const results = {
      totalQuestions,
      correctAnswers,
      accuracyRate,
      averageMastery,
      mastered,
      inProgress,
      needsWork,
      completedAt: new Date().toISOString()
    };

    // Update assessment to completed
    const { error: updateError } = await supabaseClient
      .from('diagnostic_assessments')
      .update({
        status: 'completed',
        current_phase: 'completed',
        results,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('Error updating assessment:', updateError);
      throw updateError;
    }

    // Update standard_mastery table with diagnostic results
    // This gives diagnostic data highest weight in the knowledge profile
    const studentId = assessment.student_id;
    
    // Get or create a course for this subject to link mastery data
    const { data: existingCourse } = await supabaseClient
      .from('courses')
      .select('id')
      .eq('student_id', studentId)
      .eq('subject', assessment.subject)
      .maybeSingle();

    let courseId = existingCourse?.id;

    // If no course exists, we'll store mastery without course_id
    // The course generation flow will link it later
    
    for (const [topic, mastery] of Object.entries(masteryEstimates)) {
      const masteryValue = mastery as number;
      
      // Insert into standard_mastery with high confidence from diagnostic
      const masteryData: any = {
        student_id: studentId,
        standard_code: topic,
        mastery_level: masteryValue * 100, // Convert to percentage
        total_attempts: 1,
        correct_attempts: masteryValue >= 0.7 ? 1 : 0,
        last_attempted_at: new Date().toISOString(),
      };

      if (courseId) {
        masteryData.course_id = courseId;
      }

      const { error: masteryError } = await supabaseClient
        .from('standard_mastery')
        .upsert(masteryData, {
          onConflict: courseId ? 'student_id,course_id,standard_code' : 'student_id,standard_code'
        });

      if (masteryError) {
        console.error('Error updating standard mastery:', masteryError);
      }

      // Add to progress_gaps if needs work
      if (masteryValue < 0.4) {
        const gapData: any = {
          student_id: studentId,
          standard_code: topic,
          gap_type: 'knowledge',
          severity: masteryValue < 0.2 ? 'high' : 'medium',
          confidence_score: Math.abs(masteryValue - 0.5) * 2, // 0-1 scale
          identified_at: new Date().toISOString()
        };

        if (courseId) {
          gapData.course_id = courseId;
        }

        await supabaseClient
          .from('progress_gaps')
          .insert(gapData);
      }
    }

    console.log('Assessment finalized successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        results,
        assessmentId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in finalize-diagnostic-assessment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});