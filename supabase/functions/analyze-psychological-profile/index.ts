import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { responses, studentName, gradeLevel } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Analyzing psychological profile for:', { studentName, gradeLevel });

    const systemPrompt = `You are an expert educational psychologist specializing in learning psychology, cognitive science, and personality assessment. Analyze student responses to create a comprehensive psychological and learning profile that will guide personalized educational experiences.

Your analysis should be:
1. Evidence-based and grounded in educational psychology
2. Actionable for curriculum personalization
3. Empowering and strengths-focused
4. Detailed enough to guide AI-powered content adaptation`;

    const userPrompt = `Analyze these assessment responses for ${studentName} (Grade ${gradeLevel}) and create a comprehensive psychological profile:

${JSON.stringify(responses, null, 2)}

Return a JSON object with this EXACT structure:
{
  "personality_type": "A Myers-Briggs inspired label like 'Creative Explorer' or 'Analytical Builder'",
  "psychological_profile": {
    "core_dimensions": {
      "introversion_extraversion": "score 0-100 and description",
      "sensing_intuition": "score 0-100 and description", 
      "thinking_feeling": "score 0-100 and description",
      "judging_perceiving": "score 0-100 and description"
    },
    "cognitive_strengths": ["list of 3-5 specific cognitive strengths"],
    "emotional_patterns": {
      "motivation_triggers": ["what energizes them"],
      "stress_responses": ["how they react under pressure"],
      "reward_preferences": ["what makes them feel accomplished"]
    },
    "learning_psychology": {
      "attention_style": "description of how they focus",
      "processing_speed": "fast/moderate/deliberate and why",
      "memory_type": "visual/verbal/kinesthetic/multimodal and details",
      "curiosity_drivers": ["what sparks their interest"]
    }
  },
  "learning_preferences": {
    "primary_modalities": ["ranked list of visual/auditory/kinesthetic/reading-writing"],
    "ideal_environments": {
      "physical": "description of ideal physical space",
      "social": "alone/pairs/small groups/large groups and context",
      "temporal": "time of day, duration, pacing preferences"
    },
    "engagement_strategies": {
      "content_types": ["what formats they respond to best"],
      "interaction_styles": ["how they like to engage with material"],
      "challenge_level": "optimal difficulty and scaffolding needs"
    }
  },
  "cognitive_traits": {
    "problem_solving_approach": "detailed description of how they tackle problems",
    "information_organization": "how they structure and recall information",
    "abstract_concrete_balance": "preference for abstract vs concrete",
    "sequential_global_thinking": "step-by-step vs big picture",
    "creative_analytical_balance": "creative vs analytical tendencies"
  },
  "personalization_recommendations": {
    "curriculum_adaptations": ["specific ways to adapt content"],
    "assignment_design": ["how to structure tasks for optimal engagement"],
    "feedback_approach": ["how to deliver feedback effectively"],
    "motivation_strategies": ["specific ways to keep them motivated"],
    "challenge_areas": ["potential difficulties and how to support"]
  },
  "summary": "A warm, encouraging 2-3 paragraph summary celebrating their unique learning profile and how the system will adapt to serve them"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 3000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received, parsing profile...');
    const profile = JSON.parse(data.choices[0].message.content);
    
    console.log('Generated psychological profile');

    return new Response(JSON.stringify(profile), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-psychological-profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze profile';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
