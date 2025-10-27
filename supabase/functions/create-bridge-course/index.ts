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

    // Collect diagnostic topics
    const diagnosticTopics = new Set<string>();
    const topicAreas = new Set<string>();

    knowledgeBoundaries.forEach((boundary: any) => {
      const topic = typeof boundary === 'string' ? boundary : boundary.topic;
      diagnosticTopics.add(topic);
      topicAreas.add(topic.split(' - ')[0] || topic);
    });

    strugglingTopics.forEach((topic: string) => {
      diagnosticTopics.add(topic);
      topicAreas.add(topic.split(' - ')[0] || topic);
    });

    console.log('Diagnostic topics:', Array.from(diagnosticTopics));

    // Map diagnostic topics to actual standard codes
    const mappedStandards = new Set<string>();
    
    // Get prerequisite grade bands from diagnostic
    const diagnosticBaseline = results.knowledgeBoundaries?.[0]?.estimatedGrade || 
                               results.strugglingTopics?.[0]?.estimatedGrade ||
                               Math.max(parseInt(assessment.grade_level || '5') - 3, 3);
    const searchGrades = [diagnosticBaseline, diagnosticBaseline + 1, diagnosticBaseline + 2];
    
    console.log('Searching for standards in prerequisite grades:', searchGrades);
    
    for (const topic of diagnosticTopics) {
      // Extract keywords from topic for matching
      const keywords = topic.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3);

      console.log(`Mapping topic "${topic}" with keywords:`, keywords);

      // Query standards using text matching
      if (keywords.length > 0) {
        const { data: allMatches } = await supabaseClient
          .from('standards')
          .select('code, text, grade_band')
          .eq('subject', assessment.subject)
          .eq('framework', assessment.framework || 'CA-CCSS')
          .or(keywords.map(kw => `text.ilike.%${kw}%`).join(','))
          .limit(100);

        // Filter by grade from code (e.g., "5.NBT.2" -> grade 5)
        const matchedStandards = (allMatches || []).filter(std => {
          const gradeMatch = std.code.match(/^(\d+)\./);
          if (!gradeMatch) return false;
          const grade = parseInt(gradeMatch[1]);
          return searchGrades.includes(grade);
        }).slice(0, 10);

        if (matchedStandards.length > 0) {
          console.log(`Found ${matchedStandards.length} standards for topic "${topic}":`, matchedStandards.map(s => s.code));
          // Store both real standard codes AND diagnostic label together
          matchedStandards.forEach(std => mappedStandards.add(std.code));
          mappedStandards.add(`DIAGNOSTIC:${topic}`);
        } else {
          console.log(`No standards found for topic "${topic}" in grades ${searchGrades.join(', ')} - using diagnostic code`);
          mappedStandards.add(`DIAGNOSTIC:${topic}`);
        }
      } else {
        mappedStandards.add(`DIAGNOSTIC:${topic}`);
      }
    }

    console.log('Mapped standards:', Array.from(mappedStandards));

    // Fetch full standard data for real codes
    const realCodes = Array.from(mappedStandards).filter(code => !code.startsWith('DIAGNOSTIC:'));
    let standardsData: any[] = [];
    
    if (realCodes.length > 0) {
      const { data } = await supabaseClient
        .from('standards')
        .select('code, grade_band, text, subject')
        .eq('subject', assessment.subject)
        .in('code', realCodes);
      standardsData = data || [];
    }

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
    
    // Build course goals from diagnostic topics
    const courseGoals = `Build foundational skills in ${Array.from(topicAreas).join(', ')}. Address knowledge gaps identified through diagnostic assessment to reach grade-level competency.`;

    // Get the user_id from the student record for initiated_by
    const { data: studentData } = await supabaseClient
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single();

    // Create the bridge course with CUSTOM framework to avoid grade-level mismatch warnings
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .insert({
        student_id: studentId,
        title: defaultTitle,
        subject: assessment.subject,
        grade_level: gradeRange,
        course_type: 'bridge_mode',
        description: `Foundational course created from diagnostic assessment. Addresses knowledge gaps in: ${Array.from(topicAreas).join(', ')}`,
        goals: courseGoals,
        standards_scope: [{
          framework: 'CUSTOM',
          bridge_mode: true,
          diagnostic_baseline: minGrade,
          prerequisite_bands: Array.from(new Set([minGrade, maxGrade])),
          gap_areas: Array.from(topicAreas),
          source_assessment_id: assessmentId,
          original_framework: assessment.framework || 'CA-CCSS',
          custom_standards: standardsData.map(s => ({
            code: s.code,
            text: s.text,
            grade_band: s.grade_band,
            metadata: {
              estimated_hours: 0.5,
              is_remedial: true,
              prerequisite_for: assessment.grade_level
            }
          }))
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
    Array.from(mappedStandards).forEach(std => {
      const topicArea = std.startsWith('DIAGNOSTIC:') 
        ? std.replace('DIAGNOSTIC:', '') 
        : std.split('.')[0] || 'General';
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

      // Calculate time estimate: use 30-60 min for foundational topics
      const hasRealStandards = standards.some(s => !s.startsWith('DIAGNOSTIC:'));
      const estimatedMinutes = hasRealStandards ? 45 : 30;

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
        est_minutes: estimatedMinutes,
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
        standardsCovered: mappedStandards.size,
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
