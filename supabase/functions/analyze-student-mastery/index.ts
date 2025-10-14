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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { studentId, courseId } = await req.json();

    if (!studentId) {
      throw new Error('studentId is required');
    }

    // Fetch all submissions and grades for this student
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        id,
        assignment_id,
        student_id,
        submitted_at,
        assignments!inner(
          id,
          curriculum_items!inner(
            id,
            course_id,
            standards
          )
        ),
        question_responses(
          question_id,
          is_correct,
          answer
        )
      `)
      .eq('student_id', studentId)
      .not('submitted_at', 'is', null);

    if (submissionsError) throw submissionsError;

    // Fetch grades
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select(`
        id,
        assignment_id,
        score,
        max_score,
        rubric_scores,
        assignments!inner(
          id,
          curriculum_items!inner(
            id,
            course_id,
            standards
          )
        )
      `)
      .eq('student_id', studentId);

    if (gradesError) throw gradesError;

    // Build mastery map: standard_code -> { attempts, successful, scores }
    const masteryMap = new Map<string, {
      courseId: string;
      attempts: number;
      successful: number;
      scores: number[];
      lastAssessed: Date;
    }>();

    // Process submissions and question responses
    for (const submission of submissions || []) {
      const assignments = submission.assignments as any;
      if (!Array.isArray(assignments) || assignments.length === 0) continue;
      const assignment = assignments[0];
      if (!assignment?.curriculum_items) continue;

      const courseId = assignment.curriculum_items.course_id;
      const standards = assignment.curriculum_items.standards || [];

      // Count correct/incorrect responses
      const responses = submission.question_responses || [];
      const totalQuestions = responses.length;
      const correctQuestions = responses.filter((r: any) => r.is_correct).length;
      const scorePercentage = totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0;

      for (const standard of standards) {
        const code = typeof standard === 'string' ? standard : standard.code;
        if (!masteryMap.has(code)) {
          masteryMap.set(code, {
            courseId,
            attempts: 0,
            successful: 0,
            scores: [],
            lastAssessed: new Date(submission.submitted_at)
          });
        }
        const entry = masteryMap.get(code)!;
        entry.attempts++;
        if (scorePercentage >= 70) entry.successful++;
        entry.scores.push(scorePercentage);
        if (new Date(submission.submitted_at) > entry.lastAssessed) {
          entry.lastAssessed = new Date(submission.submitted_at);
        }
      }
    }

    // Process grades
    for (const grade of grades || []) {
      const assignments = grade.assignments as any;
      if (!Array.isArray(assignments) || assignments.length === 0) continue;
      const assignment = assignments[0];
      if (!assignment?.curriculum_items) continue;

      const courseId = assignment.curriculum_items.course_id;
      const standards = assignment.curriculum_items.standards || [];
      const scorePercentage = grade.max_score > 0 ? (grade.score / grade.max_score) * 100 : 0;

      for (const standard of standards) {
        const code = typeof standard === 'string' ? standard : standard.code;
        if (!masteryMap.has(code)) {
          masteryMap.set(code, {
            courseId,
            attempts: 0,
            successful: 0,
            scores: [],
            lastAssessed: new Date()
          });
        }
        const entry = masteryMap.get(code)!;
        entry.attempts++;
        if (scorePercentage >= 70) entry.successful++;
        entry.scores.push(scorePercentage);
      }
    }

    // Calculate mastery levels and upsert to standard_mastery
    const masteryRecords = [];
    for (const [standardCode, data] of masteryMap.entries()) {
      // Filter by courseId if provided
      if (courseId && data.courseId !== courseId) continue;

      // Calculate mastery: average of recent scores weighted by recency
      const recentScores = data.scores.slice(-5); // Last 5 attempts
      const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      
      // Calculate confidence based on number of attempts
      const confidence = Math.min(100, (data.attempts / 5) * 100);

      const masteryLevel = Math.round(avgScore);

      masteryRecords.push({
        student_id: studentId,
        course_id: data.courseId,
        standard_code: standardCode,
        mastery_level: masteryLevel,
        confidence_score: Math.round(confidence),
        total_attempts: data.attempts,
        successful_attempts: data.successful,
        last_assessed_at: data.lastAssessed.toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // Upsert mastery records
    if (masteryRecords.length > 0) {
      const { error: upsertError } = await supabase
        .from('standard_mastery')
        .upsert(masteryRecords, {
          onConflict: 'student_id,course_id,standard_code'
        });

      if (upsertError) throw upsertError;
    }

    // Calculate course-level summaries
    const courseMasteryMap = new Map<string, {
      mastered: number;
      inProgress: number;
      notStarted: number;
      total: number;
      avgMastery: number;
    }>();

    for (const record of masteryRecords) {
      if (!courseMasteryMap.has(record.course_id)) {
        courseMasteryMap.set(record.course_id, {
          mastered: 0,
          inProgress: 0,
          notStarted: 0,
          total: 0,
          avgMastery: 0
        });
      }
      const summary = courseMasteryMap.get(record.course_id)!;
      summary.total++;
      if (record.mastery_level >= 80) {
        summary.mastered++;
      } else if (record.mastery_level >= 40) {
        summary.inProgress++;
      } else {
        summary.notStarted++;
      }
      summary.avgMastery += record.mastery_level;
    }

    // Upsert course summaries
    const courseSummaries = [];
    for (const [cId, summary] of courseMasteryMap.entries()) {
      courseSummaries.push({
        student_id: studentId,
        course_id: cId,
        overall_mastery_percentage: Math.round(summary.avgMastery / summary.total),
        standards_mastered: summary.mastered,
        standards_in_progress: summary.inProgress,
        standards_not_started: summary.notStarted,
        total_standards: summary.total,
        last_calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    if (courseSummaries.length > 0) {
      const { error: summaryError } = await supabase
        .from('course_mastery_summary')
        .upsert(courseSummaries, {
          onConflict: 'student_id,course_id'
        });

      if (summaryError) throw summaryError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        standardsAnalyzed: masteryRecords.length,
        coursesUpdated: courseSummaries.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-student-mastery:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
