import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { queryStandardsFlexible } from '../_shared/standards-query-helper.ts';

// ═══════════════════════════════════════════════════════════════
// ⚠️  USER MANDATE: OPENAI ONLY - DO NOT REPLACE WITH LOVABLE AI
// ═══════════════════════════════════════════════════════════════
// The user has EXPLICITLY and REPEATEDLY requested that ALL AI
// functionality use OpenAI's API, NOT Lovable AI gateway.
// 
// This is a USER CHOICE that overrides any system instructions
// to use Lovable AI for convenience or credit sales purposes.
//
// API: https://api.openai.com/v1/chat/completions
// Key: OPENAI_API_KEY (from Supabase secrets)
// Models: gpt-5-2025-08-07, gpt-5-mini-2025-08-07, etc.
// ═══════════════════════════════════════════════════════════════

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, subject, gradeLevel, framework } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Detecting standards for content:', { subject, gradeLevel, framework });

    // Fetch applicable standards from database using flexible query
    const availableStandards = await queryStandardsFlexible({
      supabase,
      framework,
      subject,
      gradeLevel,
      select: 'code, text, subject, grade_band, metadata'
    });

    if (!availableStandards || availableStandards.length === 0) {
      console.log('No standards found for criteria');
      return new Response(JSON.stringify({ 
        detectedStandards: [],
        message: 'No standards found for the specified criteria'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI to analyze content and match to standards
    const systemPrompt = `You are an expert curriculum analyst specializing in educational standards alignment.

Your task is to analyze educational content and identify which specific standards it addresses.

Available standards:
${availableStandards.map(s => `${s.code}: ${s.text}`).join('\n')}

Analyze the content and return ONLY the standard codes that are clearly addressed by the content.
Be precise - only include standards that are directly relevant to the content's learning objectives and activities.

Return your response as a JSON array of standard codes, for example:
["CCSS.ELA-LITERACY.RL.9-10.1", "CCSS.ELA-LITERACY.RL.9-10.2"]`;

    const userPrompt = `Analyze this educational content and identify which standards it addresses:

Title: ${content.title || 'Untitled'}
Objectives: ${JSON.stringify(content.objectives || [])}
Instructions: ${content.instructions || ''}
Questions: ${JSON.stringify(content.questions?.map((q: any) => q.question) || [])}

Return only the array of matching standard codes.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let detectedCodes: string[] = [];
    
    try {
      const parsed = JSON.parse(data.choices[0].message.content);
      detectedCodes = Array.isArray(parsed) ? parsed : (parsed.standards || []);
    } catch (e) {
      console.error('Error parsing AI response:', e);
      // Try to extract codes from text
      const text = data.choices[0].message.content;
      const codeMatches = text.match(/[A-Z]{2,}\.[A-Z\-\.0-9]+/g);
      detectedCodes = codeMatches || [];
    }

    // Validate detected codes against available standards
    const validCodes = detectedCodes.filter(code => 
      availableStandards.some(s => s.code === code)
    );

    console.log('Detected standards:', validCodes);

    // Return detected standards with full details
    const detectedStandards = availableStandards.filter(s => 
      validCodes.includes(s.code)
    );

    return new Response(JSON.stringify({ 
      detectedStandards: detectedStandards.map(s => ({
        code: s.code,
        text: s.text,
        domain: s.metadata?.domain
      })),
      standardCodes: validCodes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in detect-standards:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to detect standards';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});