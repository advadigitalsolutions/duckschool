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

    // Get last week's submissions
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

    // Identify gaps (< 70% accuracy or not practiced)
    const gaps = Object.entries(standardsPerformance)
      .filter(([_, perf]) => {
        const accuracy = perf.correct / perf.total;
        return accuracy < 0.7;
      })
      .map(([standard, perf]) => ({
        standard_code: standard,
        gap_type: 'struggled',
        confidence_score: perf.correct / perf.total
      }));

    // Get all course standards
    const { data: allStandards } = await supabase
      .from('curriculum_items')
      .select('standards')
      .eq('course_id', courseId);

    const practicedStandards = new Set(Object.keys(standardsPerformance));
    const allCourseStandards = new Set(
      (allStandards || []).flatMap(item => item.standards || [])
    );

    // Find standards not practiced
    allCourseStandards.forEach(std => {
      if (!practicedStandards.has(std)) {
        gaps.push({
          standard_code: std,
          gap_type: 'not_practiced',
          confidence_score: 0
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
            : 'maintain'
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
