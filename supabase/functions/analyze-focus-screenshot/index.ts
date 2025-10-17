import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { screenshot, goal, student_id, session_id, apply_penalties = false } = await req.json();
    
    console.log(`Analyzing screenshot for goal: "${goal}"`);
    
    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an accountability coach analyzing whether someone is working on their stated goal. Be encouraging but honest. Keep responses under 20 words.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `The user's goal is: "${goal}"\n\nAnalyze this screenshot. Are they working on their goal?\n\nRespond in JSON format:\n{\n  "on_track": true/false,\n  "message": "Brief encouraging message",\n  "confidence": 0-100\n}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: screenshot
                }
              }
            ]
          }
        ],
        max_tokens: 150
      }),
    });

    const aiData = await response.json();
    let content = aiData.choices[0].message.content;
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const analysis = JSON.parse(content);
    
    // Calculate XP (only apply penalties if enabled)
    const xp_awarded = analysis.on_track ? 15 : (apply_penalties ? -1 : 0);
    
    // Log to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    await supabase.from('focus_accountability_checks').insert({
      session_id,
      student_id,
      goal_text: goal,
      user_response: 'yes',
      was_on_track: analysis.on_track,
      ai_feedback: analysis.message,
      xp_awarded
    });
    
    // Update session counters
    if (session_id) {
      const { data: sessionData } = await supabase
        .from('learning_sessions')
        .select('accountability_checks_performed, accountability_checks_passed')
        .eq('id', session_id)
        .single();
      
      if (sessionData) {
        await supabase
          .from('learning_sessions')
          .update({
            accountability_checks_performed: (sessionData.accountability_checks_performed || 0) + 1,
            accountability_checks_passed: analysis.on_track 
              ? (sessionData.accountability_checks_passed || 0) + 1 
              : sessionData.accountability_checks_passed
          })
          .eq('id', session_id);
      }
    }
    
    console.log(`Analysis complete: ${analysis.on_track ? 'ON TRACK' : 'OFF TRACK'}`);
    
    return new Response(
      JSON.stringify({
        on_track: analysis.on_track,
        message: analysis.message,
        xp_awarded,
        confidence: analysis.confidence
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
