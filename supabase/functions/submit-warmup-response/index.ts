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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { assessmentId, warmupResponses } = await req.json();

    if (!assessmentId || !warmupResponses) {
      throw new Error('Assessment ID and warmup responses are required');
    }

    console.log('Processing warmup responses for assessment:', assessmentId);

    // Get the assessment
    const { data: assessment, error: fetchError } = await supabaseClient
      .from('diagnostic_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (fetchError) throw fetchError;

    // Analyze warmup responses to determine starting difficulty
    // Count confident/not confident responses
    const confidentCount = Object.values(warmupResponses).filter((v: any) => v === 'confident').length;
    const notConfidentCount = Object.values(warmupResponses).filter((v: any) => v === 'not_confident').length;
    const unsureCount = Object.values(warmupResponses).filter((v: any) => v === 'unsure').length;

    // Calculate starting mastery estimate (0.0 to 1.0)
    const totalResponses = confidentCount + notConfidentCount + unsureCount;
    const estimatedMastery = totalResponses > 0 
      ? (confidentCount + (unsureCount * 0.5)) / totalResponses
      : 0.5;

    console.log('Warmup analysis:', {
      confident: confidentCount,
      notConfident: notConfidentCount,
      unsure: unsureCount,
      estimatedMastery
    });

    // Initialize mastery estimates for all topics mentioned
    const masteryEstimates: Record<string, number> = {};
    Object.entries(warmupResponses).forEach(([topic, response]) => {
      if (response === 'confident') {
        masteryEstimates[topic] = 0.7;
      } else if (response === 'unsure') {
        masteryEstimates[topic] = 0.5;
      } else {
        masteryEstimates[topic] = 0.3;
      }
    });

    // Update assessment to deep_dive phase
    const { error: updateError } = await supabaseClient
      .from('diagnostic_assessments')
      .update({
        warmup_data: warmupResponses,
        mastery_estimates: masteryEstimates,
        current_phase: 'deep_dive',
        status: 'deep_dive',
        updated_at: new Date().toISOString()
      })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('Error updating assessment:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        nextPhase: 'deep_dive',
        estimatedMastery,
        masteryEstimates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-warmup-response:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});