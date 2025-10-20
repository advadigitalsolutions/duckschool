import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🎯 start-diagnostic-assessment called', { method: req.method, url: req.url });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const body = await req.json();
    console.log('📥 Request body:', body);
    
    const { studentId, subject, framework, gradeLevel } = body;

    console.log('Starting diagnostic assessment:', { studentId, subject, framework, gradeLevel });

    if (!studentId || !subject) {
      console.error('❌ Missing required fields');
      throw new Error('Student ID and subject are required');
    }

    // Check if student has an active assessment
    const { data: activeAssessment } = await supabaseClient
      .from('diagnostic_assessments')
      .select('*')
      .eq('student_id', studentId)
      .eq('subject', subject)
      .in('status', ['warmup', 'deep_dive'])
      .maybeSingle();

    if (activeAssessment) {
      console.log('Resuming existing assessment:', activeAssessment.id);
      return new Response(
        JSON.stringify({ 
          assessmentId: activeAssessment.id,
          phase: activeAssessment.current_phase,
          resuming: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new assessment
    const { data: newAssessment, error: insertError } = await supabaseClient
      .from('diagnostic_assessments')
      .insert({
        student_id: studentId,
        subject,
        framework: framework || null,
        grade_level: gradeLevel || null,
        status: 'warmup',
        current_phase: 'warmup',
        warmup_data: {},
        mastery_estimates: {},
        questions_asked: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating assessment:', insertError);
      throw insertError;
    }

    console.log('Created new assessment:', newAssessment.id);

    return new Response(
      JSON.stringify({ 
        assessmentId: newAssessment.id,
        phase: 'warmup',
        resuming: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in start-diagnostic-assessment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
