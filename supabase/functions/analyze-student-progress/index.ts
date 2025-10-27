import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, studentId } = await req.json();

    if (!courseId || !studentId) {
      throw new Error('courseId and studentId are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get course details
    const { data: course } = await supabase
      .from('courses')
      .select('*, students(*)')
      .eq('id', courseId)
      .single();

    if (!course) {
      throw new Error('Course not found');
    }

    // Query standard_mastery table for comprehensive mastery data
    const { data: standardMastery } = await supabase
      .from('standard_mastery')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .order('last_attempted_at', { ascending: false });

    console.log('Standard mastery data:', {
      total_standards: standardMastery?.length || 0,
      diagnostic_only: standardMastery?.filter(m => m.total_attempts === 1).length || 0,
      assignment_practiced: standardMastery?.filter(m => (m.total_attempts || 0) > 1).length || 0
    });

    // Get last week's submissions for recent performance metrics
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, assignment_id, time_spent_seconds, submitted_at')
      .eq('student_id', studentId)
      .gte('submitted_at', oneWeekAgo)
      .order('submitted_at', { ascending: false });

    // Get assignment details
    const assignmentIds = (submissions || []).map(s => s.assignment_id).filter(Boolean);
    const { data: assignments } = assignmentIds.length > 0
      ? await supabase
          .from('assignments')
          .select('id, curriculum_item_id, curriculum_items(id, title, standards)')
          .in('id', assignmentIds)
      : { data: [] };

    // Get question responses for these submissions
    const submissionIds = (submissions || []).map(s => s.id);
    
    const { data: responses } = submissionIds.length > 0 
      ? await supabase
          .from('question_responses')
          .select('*')
          .in('submission_id', submissionIds)
      : { data: [] };

    // Analyze performance by standard
    const standardsPerformance: Record<string, { 
      total: number; 
      correct: number; 
      standards: string[];
    }> = {};

    (submissions || []).forEach(sub => {
      const assignment = (assignments || []).find((a: any) => a.id === sub.assignment_id);
      const curriculumItem = assignment?.curriculum_items as any;
      const standards = curriculumItem?.standards || [];
      const submissionResponses = (responses || []).filter(r => r.submission_id === sub.id);
      
      if (submissionResponses.length > 0) {
        const correctCount = submissionResponses.filter(r => r.is_correct).length;
        
        standards.forEach((std: string) => {
          if (!standardsPerformance[std]) {
            standardsPerformance[std] = { total: 0, correct: 0, standards: [] };
          }
          standardsPerformance[std].total += submissionResponses.length;
          standardsPerformance[std].correct += correctCount;
          if (!standardsPerformance[std].standards.includes(std)) {
            standardsPerformance[std].standards.push(std);
          }
        });
      }
    });

    // Build comprehensive mastery data with recency tracking
    const masteryData = (standardMastery || []).map(m => ({
      standard_code: m.standard_code,
      mastery_level: m.mastery_level,
      confidence_score: m.confidence_score,
      total_attempts: m.total_attempts,
      successful_attempts: m.successful_attempts,
      last_attempted_at: m.last_attempted_at,
      data_source: m.total_attempts === 1 ? 'diagnostic' : 'assignments',
      is_recent: new Date(m.last_attempted_at).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000) // within 30 days
    }));

    // Identify gaps from mastery data
    const gaps = masteryData
      .filter(m => (m.mastery_level || 0) < 70)
      .map(m => ({
        standard_code: m.standard_code,
        gap_type: m.data_source === 'diagnostic' ? 'diagnostic_weakness' : 'struggled',
        confidence_score: m.confidence_score || 0,
        mastery_level: m.mastery_level || 0,
        data_source: m.data_source,
        last_attempted_at: m.last_attempted_at,
        // Prioritize diagnostic-only gaps that haven't been addressed
        priority: m.data_source === 'diagnostic' ? 'high' : 'medium'
      }))
      .sort((a, b) => {
        // Sort by priority (diagnostic first) then by mastery level (lowest first)
        if (a.priority !== b.priority) {
          return a.priority === 'high' ? -1 : 1;
        }
        return (a.mastery_level || 0) - (b.mastery_level || 0);
      });

    // Get all course standards to find unpracticed ones
    const { data: allStandards } = await supabase
      .from('curriculum_items')
      .select('standards')
      .eq('course_id', courseId);

    const practicedStandards = new Set(masteryData.map(m => m.standard_code));
    const allCourseStandards = new Set(
      (allStandards || []).flatMap(item => item.standards || [])
    );

    // Find standards not practiced at all
    allCourseStandards.forEach(std => {
      if (!practicedStandards.has(std)) {
        gaps.push({
          standard_code: std,
          gap_type: 'not_practiced',
          confidence_score: 0,
          mastery_level: 0,
          data_source: 'none',
          last_attempted_at: null,
          priority: 'low'
        });
      }
    });

    // Extract current interests from student profile
    const student = course.students;
    const interests = student?.special_interests || [];
    const learningProfile = student?.learning_profile || {};

    // Calculate average time per assignment
    const avgTimeMinutes = (submissions || []).length > 0
      ? Math.round(
          (submissions || []).reduce((sum, s) => sum + (s.time_spent_seconds || 0), 0) 
          / (submissions || []).length / 60
        )
      : 30;

    return new Response(
      JSON.stringify({
        gaps,
        masteryData,
        interests,
        learningProfile,
        recentPerformance: {
          assignmentsCompleted: (submissions || []).length,
          averageTimeMinutes: avgTimeMinutes,
          overallAccuracy: responses && responses.length > 0
            ? responses.filter(r => r.is_correct).length / responses.length
            : 0
        },
        recommendations: {
          focusAreas: gaps.slice(0, 5).map(g => g.standard_code),
          suggestedDifficulty: responses && responses.length > 0 && 
            responses.filter(r => r.is_correct).length / responses.length > 0.8 
            ? 'increase' 
            : 'maintain',
          diagnosticGapsPriority: gaps.filter(g => g.data_source === 'diagnostic').slice(0, 3).map(g => g.standard_code)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error analyzing progress:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
