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

    console.log('Finalizing adaptive diagnostic assessment:', assessmentId);

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

    // ===== CALCULATE ADAPTIVE RESULTS =====
    const totalQuestions = responses?.length || 0;
    const correctAnswers = responses?.filter(r => r.is_correct).length || 0;
    const accuracyRate = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;

    // Use the detailed mastery estimates from the assessment
    const detailedEstimates = assessment.mastery_estimates || {};
    
    // Categorize topics based on mastery level
    const masteredTopics: string[] = [];
    const knowledgeBoundaries: Array<{topic: string, mastery: number, prerequisite?: string}> = [];
    const strugglingTopics: string[] = [];
    const untestedTopics: string[] = [];

    // Fetch prerequisites for learning path generation
    const { data: prerequisites } = await supabaseClient
      .from('standard_prerequisites')
      .select('*')
      .eq('subject', assessment.subject);

    const prereqMap = new Map<string, string[]>();
    prerequisites?.forEach(p => {
      if (!prereqMap.has(p.standard_code)) {
        prereqMap.set(p.standard_code, []);
      }
      prereqMap.get(p.standard_code)!.push(p.prerequisite_code);
    });

    // **PHASE 3: Analyze each topic with confidence scoring**
    Object.entries(detailedEstimates).forEach(([topic, estimate]: [string, any]) => {
      const confidence = estimate.confidence || 0.5;
      
      if (!estimate.tested) {
        untestedTopics.push(topic);
      } else if (estimate.knowledge_boundary) {
        knowledgeBoundaries.push({
          topic,
          mastery: estimate.mastery,
          prerequisite: estimate.prerequisite_tested
        });
      } else if (estimate.mastery >= 0.7 && confidence >= 0.7) {
        // Require high confidence for mastered topics
        masteredTopics.push(topic);
      } else if (estimate.mastery < 0.4 && confidence >= 0.6) {
        // Only count as struggling if confident in the assessment
        strugglingTopics.push(topic);
      } else if (confidence < 0.5) {
        // Low confidence = effectively untested
        untestedTopics.push(topic);
      }
    });

    // Generate recommended learning path
    const learningPath: Array<{topic: string, reason: string, priority: number}> = [];
    
    // Priority 1: Teach prerequisites of knowledge boundaries
    knowledgeBoundaries.forEach(boundary => {
      const prereqs = prereqMap.get(boundary.topic) || [];
      prereqs.forEach(prereq => {
        const prereqEstimate = detailedEstimates[prereq];
        if (!prereqEstimate || prereqEstimate.mastery < 0.7) {
          learningPath.push({
            topic: prereq,
            reason: `Foundation needed for ${boundary.topic}`,
            priority: 1
          });
        }
      });
    });

    // Priority 2: Address struggling topics' prerequisites
    strugglingTopics.forEach(topic => {
      const prereqs = prereqMap.get(topic) || [];
      if (prereqs.length > 0) {
        learningPath.push({
          topic: prereqs[0],
          reason: `Essential prerequisite for ${topic}`,
          priority: 2
        });
      } else {
        learningPath.push({
          topic,
          reason: `Needs foundational review`,
          priority: 2
        });
      }
    });

    // Priority 3: Build on mastered topics
    masteredTopics.forEach(topic => {
      // Find topics that have this as a prerequisite
      prerequisites?.forEach(p => {
        if (p.prerequisite_code === topic && !masteredTopics.includes(p.standard_code)) {
          learningPath.push({
            topic: p.standard_code,
            reason: `Build on mastery of ${topic}`,
            priority: 3
          });
        }
      });
    });

    // Sort learning path by priority and remove duplicates
    const uniquePath = learningPath
      .sort((a, b) => a.priority - b.priority)
      .filter((item, index, self) => 
        index === self.findIndex((t) => t.topic === item.topic)
      );

    // Calculate average mastery
    const testedTopics = Object.entries(detailedEstimates)
      .filter(([_, e]: [string, any]) => e.tested);
    const averageMastery = testedTopics.length > 0
      ? testedTopics.reduce((sum, [_, e]: [string, any]) => sum + e.mastery, 0) / testedTopics.length
      : 0;

    // Identify suspected careless errors
    const suspectedCarelessErrors = Object.entries(detailedEstimates)
      .filter(([_, e]: [string, any]) => e.careless_error_suspected)
      .map(([topic, _]) => topic);

    const results = {
      totalQuestions,
      correctAnswers,
      accuracyRate,
      averageMastery,
      masteredTopics,
      knowledgeBoundaries,
      strugglingTopics,
      learningPath: uniquePath.slice(0, 10), // Top 10 recommendations
      masteryByTopic: detailedEstimates,
      completedAt: new Date().toISOString(),
      suspectedCarelessErrors, // Add careless error report
      diagnosticQuality: {
        questionsAsked: totalQuestions,
        topicsConfidentlyAssessed: testedTopics.filter(([_, e]: [string, any]) => 
          e.tested && (e.confidence || 0) >= 0.7
        ).length,
        lowConfidenceTopics: testedTopics.filter(([_, e]: [string, any]) => 
          e.tested && (e.confidence || 0) < 0.5
        ).length
      }
    };

    console.log('Adaptive results:', {
      mastered: masteredTopics.length,
      boundaries: knowledgeBoundaries.length,
      struggling: strugglingTopics.length,
      pathLength: uniquePath.length
    });

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
    const studentId = assessment.student_id;
    
    // Get or create a course for this subject to link mastery data
    const { data: existingCourse } = await supabaseClient
      .from('courses')
      .select('id')
      .eq('student_id', studentId)
      .eq('subject', assessment.subject)
      .maybeSingle();

    let courseId = existingCourse?.id;

    // Map topics to actual standard codes and update mastery
    for (const [topic, estimate] of Object.entries(detailedEstimates)) {
      const est = estimate as any;
      if (!est.tested) continue;
      
      // Try to find matching standards from the standards table
      const { data: matchingStandards } = await supabaseClient
        .from('standards')
        .select('code, grade_band, text')
        .eq('subject', assessment.subject)
        .ilike('text', `%${topic}%`)
        .limit(5);
      
      // Create standard codes array - use matched standards or topic name as fallback
      const standardCodes = matchingStandards && matchingStandards.length > 0
        ? matchingStandards.map(s => s.code)
        : [topic]; // Use topic as standard code if no match found
      
      console.log(`Mapping topic "${topic}" to standards:`, standardCodes);
      
      // Save mastery for each matched standard
      for (const standardCode of standardCodes) {
        const masteryData: any = {
          student_id: studentId,
          standard_code: standardCode,
          mastery_level: est.mastery * 100, // Convert to percentage
          confidence_score: (est.confidence || 0.5) * 100,
          total_attempts: 1, // Diagnostic = 1 attempt
          correct_attempts: est.successful_attempts || 0,
          last_attempted_at: new Date().toISOString(),
          course_id: null // Null indicates diagnostic data, not course-specific
        };

        const { error: masteryError } = await supabaseClient
          .from('standard_mastery')
          .upsert(masteryData, {
            onConflict: 'student_id,standard_code',
            ignoreDuplicates: false
          });

        if (masteryError) {
          console.error('Error updating standard mastery:', masteryError);
        }

        // Add to progress_gaps if struggling or at knowledge boundary
        if (est.mastery < 0.4 || est.knowledge_boundary) {
          const gapData: any = {
            student_id: studentId,
            standard_code: standardCode,
            gap_type: est.knowledge_boundary ? 'knowledge_boundary' : 'knowledge',
            severity: est.mastery < 0.2 ? 'high' : 'medium',
            confidence_score: est.confidence || 0.5,
            identified_at: new Date().toISOString(),
            course_id: null // Diagnostic gaps are not course-specific initially
          };

          await supabaseClient
            .from('progress_gaps')
            .insert(gapData);
        }
      }
    }
    
    console.log('Diagnostic mastery data saved to standard_mastery table');

    console.log('Adaptive assessment finalized successfully');

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