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

    const { assessmentId, studentId, courseTitle } = await req.json();

    if (!assessmentId || !studentId) {
      throw new Error('Assessment ID and Student ID are required');
    }

    console.log('Creating bridge course for assessment:', assessmentId);

    // Fetch the diagnostic assessment
    const { data: assessment, error: assessmentError } = await supabaseClient
      .from('diagnostic_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assessmentError) throw assessmentError;

    const results = assessment.results || {};
    const knowledgeBoundaries = results.knowledgeBoundaries || [];
    const strugglingTopics = results.strugglingTopics || [];
    const masteryByTopic = results.masteryByTopic || {};

    if (knowledgeBoundaries.length === 0 && strugglingTopics.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No foundational gaps identified. No bridge course needed.',
          shouldCreateCourse: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch prerequisites for all struggling topics
    const { data: prerequisites } = await supabaseClient
      .from('standard_prerequisites')
      .select('*')
      .eq('subject', assessment.subject);

    // Build prerequisite map
    const prereqMap = new Map<string, string[]>();
    prerequisites?.forEach(p => {
      if (!prereqMap.has(p.standard_code)) {
        prereqMap.set(p.standard_code, []);
      }
      prereqMap.get(p.standard_code)!.push(p.prerequisite_code);
    });

    // Collect all standards that need to be taught
    const standardsToTeach = new Set<string>();
    const topicAreas = new Set<string>();

    // Add prerequisites for knowledge boundaries
    knowledgeBoundaries.forEach((boundary: any) => {
      const topic = typeof boundary === 'string' ? boundary : boundary.topic;
      standardsToTeach.add(topic);
      topicAreas.add(topic.split(' - ')[0] || topic);
      
      // Add prerequisites
      const prereqs = prereqMap.get(topic) || [];
      prereqs.forEach(p => standardsToTeach.add(p));
    });

    // Add struggling topics and their prerequisites
    strugglingTopics.forEach((topic: string) => {
      standardsToTeach.add(topic);
      topicAreas.add(topic.split(' - ')[0] || topic);
      
      const prereqs = prereqMap.get(topic) || [];
      prereqs.forEach(p => standardsToTeach.add(p));
    });

    // Fetch actual standard data for the identified standards
    const { data: standardsData } = await supabaseClient
      .from('standards')
      .select('code, grade_band, text, subject')
      .eq('subject', assessment.subject)
      .in('code', Array.from(standardsToTeach).slice(0, 100)); // Limit for safety

    // Determine grade range from standards
    let minGrade = 12;
    let maxGrade = 0;
    standardsData?.forEach(s => {
      const gradeMatch = s.code.match(/^(\d+)\./);
      if (gradeMatch) {
        const grade = parseInt(gradeMatch[1]);
        minGrade = Math.min(minGrade, grade);
        maxGrade = Math.max(maxGrade, grade);
      }
    });

    const gradeRange = minGrade <= maxGrade ? `${minGrade}-${maxGrade}` : assessment.grade_level || '5';
    const defaultTitle = courseTitle || `${assessment.subject} Foundations`;

    // Get the user_id from the student record for initiated_by
    const { data: studentData } = await supabaseClient
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single();

    // Create the bridge course
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .insert({
        student_id: studentId,
        title: defaultTitle,
        subject: assessment.subject,
        grade_level: gradeRange,
        course_type: 'bridge_mode',
        description: `Foundational course created from diagnostic assessment. Addresses knowledge gaps in: ${Array.from(topicAreas).join(', ')}`,
        standards_scope: [{
          framework: assessment.framework || 'CA-CCSS',
          bridge_mode: true,
          diagnostic_baseline: minGrade,
          prerequisite_bands: Array.from(new Set([minGrade, maxGrade])),
          gap_areas: Array.from(topicAreas),
          source_assessment_id: assessmentId
        }],
        auto_generate_weekly: false,
        archived: false,
        initiated_by: studentData?.user_id || null,
        initiated_by_role: 'student'
      })
      .select()
      .single();

    if (courseError) {
      console.error('Error creating course:', courseError);
      throw courseError;
    }

    console.log('Bridge course created:', course.id);

    // Create initial curriculum items for each standard cluster
    const curriculumItems: any[] = [];
    
    // Group standards by topic area
    const topicGroups = new Map<string, string[]>();
    Array.from(standardsToTeach).forEach(std => {
      const topicArea = std.split(' - ')[0] || 'General';
      if (!topicGroups.has(topicArea)) {
        topicGroups.set(topicArea, []);
      }
      topicGroups.get(topicArea)!.push(std);
    });

    // Create one curriculum item per topic group
    for (const [topicArea, standards] of topicGroups.entries()) {
      const masteryLevel = standards.reduce((avg, std) => {
        const topic = masteryByTopic[std];
        return avg + (topic?.mastery || 0);
      }, 0) / standards.length;

      curriculumItems.push({
        course_id: course.id,
        title: `${topicArea} - Foundation Review`,
        type: 'lesson',
        standards: standards,
        body: {
          objective: `Review and strengthen foundational understanding of ${topicArea}`,
          lesson_core: {
            content: `This lesson will help you build a strong foundation in ${topicArea}. We'll start with the basics and gradually work up to more complex concepts.`,
            activities: []
          }
        },
        est_minutes: 30,
        assessment_type: 'practice'
      });
    }

    if (curriculumItems.length > 0) {
      const { error: itemsError } = await supabaseClient
        .from('curriculum_items')
        .insert(curriculumItems);

      if (itemsError) {
        console.error('Error creating curriculum items:', itemsError);
      }
    }

    // Link the diagnostic to the course
    await supabaseClient
      .from('diagnostic_derived_courses')
      .insert({
        assessment_id: assessmentId,
        course_id: course.id,
        student_id: studentId,
        gap_areas_addressed: Array.from(topicAreas)
      })
      .select()
      .single();

    console.log('Bridge course created successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        courseId: course.id,
        courseName: defaultTitle,
        standardsCovered: standardsToTeach.size,
        gradeRange,
        topicAreas: Array.from(topicAreas)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-bridge-course:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
