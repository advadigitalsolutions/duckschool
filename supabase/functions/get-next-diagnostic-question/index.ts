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

    console.log('Getting next adaptive question for assessment:', assessmentId);

    // Fetch assessment with current mastery state
    const { data: assessment, error: assessmentError } = await supabaseClient
      .from('diagnostic_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assessmentError) throw assessmentError;

    // Get all previous responses
    const { data: responses, error: responsesError } = await supabaseClient
      .from('diagnostic_question_responses')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false });

    if (responsesError) throw responsesError;

    const questionsAsked = responses?.length || 0;
    const MAX_QUESTIONS = 20; // Allow for deeper exploration

    if (questionsAsked >= MAX_QUESTIONS) {
      console.log('Assessment complete - max questions reached');
      return new Response(
        JSON.stringify({ complete: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== ADAPTIVE QUESTION SELECTION =====
    const masteryEstimates = assessment.mastery_estimates || {};
    const lastResponse = responses && responses.length > 0 ? responses[0] : null;
    
    console.log('Current mastery estimates:', masteryEstimates);
    console.log('Last response:', lastResponse?.standard_code, lastResponse?.is_correct);

    // Fetch prerequisite relationships
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

    // Topic hierarchy: maps easier topics to their harder counterparts
    // If the harder topic is mastered, skip testing the easier one unless there's a failure
    const topicHierarchy = new Map<string, string>([
      ['Addition - Single-digit', 'Addition - Multi-digit'],
      ['Subtraction - Single-digit', 'Subtraction - Multi-digit'],
      ['Multiplication - Single-digit', 'Multiplication - Multi-digit'],
      ['Division - Single-digit', 'Division - Multi-digit'],
    ]);

    // Track consecutive correct answers
    const consecutiveCorrect = responses?.filter((r, idx) => 
      idx < 5 && r.is_correct
    ).length || 0;
    
    console.log('Consecutive correct answers:', consecutiveCorrect);

    // Determine next topic and difficulty based on adaptive logic
    let targetTopic = '';
    let targetDifficulty = 0.5;
    let rationale = '';

    // **PHASE 3: Pattern detection for careless errors**
    const recentResponsePattern = responses?.slice(0, 5);
    const sameTopicResponses = responses?.filter(r => r.standard_code === lastResponse?.standard_code);

    if (lastResponse && !lastResponse.is_correct) {
      // Student got the last question wrong - adaptive response
      const lastTopic = lastResponse.standard_code;
      const lastDifficulty = lastResponse.difficulty_level || 0.5;
      const topicEstimate = masteryEstimates[lastTopic] || {};
      const attempts = topicEstimate.attempts || 0;

      // Careless error indicators
      const hasConsecutiveCorrect = recentResponsePattern?.filter(r => r.is_correct).length >= 3;
      const lastTopicWasMastered = sameTopicResponses?.filter(r => r.is_correct).length > 0;
      const isLowDifficultyFailure = lastDifficulty < 0.4;

      // If all indicators suggest careless error, don't count as heavily
      if (hasConsecutiveCorrect && lastTopicWasMastered && isLowDifficultyFailure) {
        console.log('⚠️ Likely careless error detected - not penalizing mastery heavily');
        
        // Update mastery estimate with lower weight and flag
        masteryEstimates[lastTopic] = {
          ...topicEstimate,
          careless_error_suspected: true,
          confidence: (topicEstimate.confidence || 0.5) * 0.8
        };
        
        // Move to next untested topic instead of drilling down
        const untestedTopics: string[] = [];
        const allTopics = new Set<string>();
        prerequisites?.forEach(p => {
          allTopics.add(p.standard_code);
          allTopics.add(p.prerequisite_code);
        });

        allTopics.forEach(topic => {
          const estimate = masteryEstimates[topic];
          if (!estimate || !estimate.tested) {
            untestedTopics.push(topic);
          }
        });

        if (untestedTopics.length > 0) {
          targetTopic = untestedTopics[0];
          targetDifficulty = 0.5;
          rationale = `Suspected careless error on ${lastTopic} - testing breadth instead`;
        } else {
          // No untested topics, continue with normal logic
          targetTopic = lastTopic;
          targetDifficulty = Math.max(0.2, lastDifficulty - 0.2);
          rationale = `Careless error suspected but no untested topics - trying slightly easier`;
        }
      } else if (attempts === 0) {

      } else if (attempts === 1) {
        // First wrong answer - try easier on same topic
        targetTopic = lastTopic;
        targetDifficulty = Math.max(0.2, lastDifficulty - 0.3);
        rationale = `First incorrect answer on ${lastTopic} - trying easier question`;
      } else {
        // Second+ wrong answer - check prerequisite
        const prereqs = prereqMap.get(lastTopic);
        if (prereqs && prereqs.length > 0) {
          // Test the prerequisite
          const prereq = prereqs[0]; // Take the most direct prerequisite
          targetTopic = prereq;
          targetDifficulty = 0.5;
          rationale = `Multiple failures on ${lastTopic} - testing prerequisite: ${prereq}`;
          
          // Mark this as a knowledge boundary
          masteryEstimates[lastTopic] = {
            ...topicEstimate,
            knowledge_boundary: true,
            prerequisite_tested: prereq
          };
        } else {
          // No prerequisite found - try much easier on same topic
          targetTopic = lastTopic;
          targetDifficulty = 0.2;
          rationale = `No prerequisite found for ${lastTopic} - trying easiest level`;
        }
      }
    } else {
      // Student got last question correct OR this is the first question
      // Modified priority order:
      // 1. Force breadth testing after 3+ consecutive correct answers
      // 2. Prioritize breadth over uncertain topics after 2+ consecutive correct
      // 3. Untested prerequisites of failed topics
      // 4. Knowledge boundaries (where mastery transitions)
      // 5. Uncertain topics (only if they have conflicting results or aren't easier versions of mastered topics)
      // 6. Breadth testing (untested topics)

      const untestedPrereqs: string[] = [];
      const knowledgeBoundaries: string[] = [];
      const uncertainTopics: string[] = [];
      const untestedTopics: string[] = [];

      // Get all potential topics from prerequisites
      const allTopics = new Set<string>();
      prerequisites?.forEach(p => {
        allTopics.add(p.standard_code);
        allTopics.add(p.prerequisite_code);
      });

      allTopics.forEach(topic => {
        const estimate = masteryEstimates[topic];
        
        if (!estimate || !estimate.tested) {
          // Check if this is an easier topic with a tested harder counterpart
          const harderTopic = topicHierarchy.get(topic);
          const harderEstimate = harderTopic ? masteryEstimates[harderTopic] : null;
          
          // Skip this untested topic if the harder version has already been tested
          if (harderEstimate && harderEstimate.tested) {
            console.log(`Skipping untested ${topic} - harder topic ${harderTopic} already tested`);
            return; // Skip to next topic
          }
          
          // Check if this is a prerequisite of a failed topic
          let isPrereqOfFailed = false;
          for (const [failedTopic, failedEstimate] of Object.entries(masteryEstimates)) {
            if ((failedEstimate as any).mastery < 0.4 && prereqMap.get(failedTopic)?.includes(topic)) {
              isPrereqOfFailed = true;
              break;
            }
          }
          
          if (isPrereqOfFailed) {
            untestedPrereqs.push(topic);
          } else {
            untestedTopics.push(topic);
          }
        } else if (estimate.knowledge_boundary) {
          knowledgeBoundaries.push(topic);
        } else if (estimate.mastery >= 0.3 && estimate.mastery <= 0.7 && (estimate.confidence || 0) < 0.85) {
          // Check if this is an easier topic with a mastered harder counterpart
          const harderTopic = topicHierarchy.get(topic);
          const harderEstimate = harderTopic ? masteryEstimates[harderTopic] : null;
          
          // Skip this uncertain topic if the harder version is already mastered (70%+)
          // unless there's conflicting evidence (some correct, some wrong)
          if (harderEstimate && harderEstimate.mastery >= 0.70) {
            console.log(`Skipping ${topic} - harder topic ${harderTopic} already mastered at ${harderEstimate.mastery}`);
          } else {
            uncertainTopics.push(topic);
          }
        }
      });

      // Select topic based on adaptive priority
      // FORCE breadth testing after 3+ consecutive correct answers
      if (consecutiveCorrect >= 3 && untestedTopics.length > 0) {
        targetTopic = untestedTopics[0];
        targetDifficulty = 0.5;
        rationale = `${consecutiveCorrect} consecutive correct - forcing breadth testing: ${targetTopic}`;
      } 
      // PRIORITIZE breadth over uncertain topics after 2+ consecutive correct
      else if (consecutiveCorrect >= 2 && untestedTopics.length > 0) {
        targetTopic = untestedTopics[0];
        targetDifficulty = 0.5;
        rationale = `${consecutiveCorrect} consecutive correct - prioritizing breadth: ${targetTopic}`;
      }
      // Standard priority when not forcing breadth
      else if (untestedPrereqs.length > 0) {
        targetTopic = untestedPrereqs[0];
        targetDifficulty = 0.5;
        rationale = `Testing untested prerequisite: ${targetTopic}`;
      } else if (knowledgeBoundaries.length > 0) {
        targetTopic = knowledgeBoundaries[0];
        const estimate = masteryEstimates[targetTopic];
        targetDifficulty = estimate.last_difficulty ? estimate.last_difficulty - 0.2 : 0.4;
        rationale = `Refining knowledge boundary: ${targetTopic}`;
      } else if (uncertainTopics.length > 0) {
        targetTopic = uncertainTopics[0];
        const estimate = masteryEstimates[targetTopic];
        
        // Smarter difficulty: if related harder topic is mastered, start at higher difficulty
        const harderTopic = topicHierarchy.get(targetTopic);
        const harderEstimate = harderTopic ? masteryEstimates[harderTopic] : null;
        if (harderEstimate && harderEstimate.mastery >= 0.60) {
          targetDifficulty = Math.min(0.8, 0.5 + (harderEstimate.mastery - 0.6) / 2);
          rationale = `Clarifying ${targetTopic} (higher difficulty due to ${harderTopic} mastery)`;
        } else {
          targetDifficulty = estimate.mastery > 0.5 ? 0.6 : 0.4;
          rationale = `Clarifying uncertain topic: ${targetTopic}`;
        }
      } else if (untestedTopics.length > 0) {
        targetTopic = untestedTopics[0];
        targetDifficulty = 0.5;
        rationale = `Breadth testing: ${targetTopic}`;
      } else {
        // All topics tested - pick lowest mastery for refinement
        const lowestMastery = Object.entries(masteryEstimates)
          .filter(([_, e]: [string, any]) => e.tested)
          .sort(([_, a]: [string, any], [__, b]: [string, any]) => a.mastery - b.mastery)[0];
        
        if (lowestMastery) {
          targetTopic = lowestMastery[0];
          targetDifficulty = 0.3;
          rationale = `Refining lowest mastery topic: ${targetTopic}`;
        } else {
          // Fallback - assessment should be complete
          return new Response(
            JSON.stringify({ complete: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    console.log('Adaptive selection:', { targetTopic, targetDifficulty, rationale });

    // ===== GENERATE SINGLE QUESTION =====
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const subjectContext = assessment.subject === 'Home Economics' || assessment.subject === 'Life Skills'
      ? 'real-world practical life skills like cooking, budgeting, household management, nutrition, sewing, cleaning, time management, etc.'
      : assessment.subject;

    const prompt = `Generate 1 diagnostic question for ${subjectContext} (${assessment.grade_level || 'middle school'}).

Topic: ${targetTopic}
Difficulty: ${targetDifficulty.toFixed(2)} (0=easiest, 1=hardest)
Context: ${rationale}

Create a clear, grade-appropriate multiple-choice question that:
1. Accurately assesses understanding of ${targetTopic}
2. Matches the ${targetDifficulty.toFixed(2)} difficulty level
3. Has 4 answer options (A, B, C, D)
4. Includes a brief explanation of the correct answer
5. Is practical and relatable to real-life situations

Return exactly 1 question.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an educational assessment expert. Generate clear, appropriate questions.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_questions',
            description: 'Generate diagnostic questions',
            parameters: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      options: {
                        type: 'object',
                        properties: {
                          A: { type: 'string' },
                          B: { type: 'string' },
                          C: { type: 'string' },
                          D: { type: 'string' }
                        },
                        required: ['A', 'B', 'C', 'D']
                      },
                      correct_answer: { type: 'string', enum: ['A', 'B', 'C', 'D'] },
                      explanation: { type: 'string' }
                    },
                    required: ['question', 'options', 'correct_answer', 'explanation']
                  }
                }
              },
              required: ['questions']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_questions' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    const batchData = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!batchData || !batchData.questions || batchData.questions.length === 0) {
      throw new Error('Failed to generate question');
    }

    const q = batchData.questions[0];
    const question = {
      complete: false,
      questionNumber: questionsAsked + 1,
      topic: targetTopic,
      difficulty: targetDifficulty,
      question: q.question,
      options: q.options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation
    };

    console.log('Generated adaptive question for topic:', question.topic);

    // Update mastery estimates with new question info
    if (!masteryEstimates[targetTopic]) {
      masteryEstimates[targetTopic] = {};
    }
    masteryEstimates[targetTopic].last_difficulty = targetDifficulty;
    masteryEstimates[targetTopic].attempts = (masteryEstimates[targetTopic].attempts || 0) + 1;

    await supabaseClient
      .from('diagnostic_assessments')
      .update({ 
        mastery_estimates: masteryEstimates,
        question_batch: [] // Clear any old cached questions
      })
      .eq('id', assessmentId);

    // Return the question
    return new Response(
      JSON.stringify(question),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-next-diagnostic-question:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});