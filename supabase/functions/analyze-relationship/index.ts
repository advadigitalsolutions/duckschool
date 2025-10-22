import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentProfile, educatorProfile, viewerRole } = await req.json();

    console.log('Generating relationship analysis for:', viewerRole);

    const systemPrompt = `You are an expert educational psychologist specializing in Myers-Briggs personality types and learning relationships. Analyze the psychological profiles of a student and their educator to provide actionable insights for building a successful learning partnership.

Your analysis should be tailored to the ${viewerRole === 'student' ? 'student' : 'educator'}'s perspective, giving them specific guidance on how to work with their ${viewerRole === 'student' ? 'educator' : 'student'}.

Focus on:
1. Communication styles and how they can adapt to each other
2. Learning/teaching approaches that will work best
3. Potential areas of friction and how to navigate them
4. Shared strengths they can leverage
5. Concrete action steps they can take

Be warm, encouraging, and specific. Use real examples where possible.`;

    const userPrompt = `Student Profile:
Name: ${studentProfile.name}
Psychological Profile: ${JSON.stringify(studentProfile.psychological_profile, null, 2)}
Learning Preferences: ${JSON.stringify(studentProfile.learning_preferences, null, 2)}

Educator Profile:
Name: ${educatorProfile.name}
Psychological Profile: ${JSON.stringify(educatorProfile.psychological_profile, null, 2)}
Learning Preferences: ${JSON.stringify(educatorProfile.learning_preferences, null, 2)}

Generate a comprehensive relationship analysis tailored to the ${viewerRole}'s perspective. Return as JSON with this structure:
{
  "overview": "2-3 sentence overview of the partnership dynamic",
  "communication_strategies": ["strategy1", "strategy2", "strategy3"],
  "learning_approach": ["approach1", "approach2", "approach3"],
  "potential_challenges": ["challenge1", "challenge2"],
  "partnership_strengths": ["strength1", "strength2", "strength3"],
  "action_steps": ["step1", "step2", "step3"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received, parsing analysis...');
    const analysis = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-relationship function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
