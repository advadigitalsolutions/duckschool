import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, requirements } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Researching standards for:', requirements);

    // Phase 1: Research sources and legal requirements
    const researchPrompt = `You are researching educational standards and homeschool legal requirements.

Requirements:
- State: ${requirements.state || 'Not specified'}
- Grade Level: ${requirements.grade || 'Not specified'}
- Subjects: ${requirements.subjects?.join(', ') || 'All core subjects'}

Please provide:
1. Official sources for state standards (URLs and descriptions)
2. Homeschool legal requirements for this state including:
   - Required subjects
   - Required instructional hours/days
   - Testing/assessment requirements
   - Record keeping requirements
   - Notification/registration requirements
   - Any exemptions or special provisions
3. Recommended documentation practices

Format as JSON with this structure:
{
  "sources": [{"url": "...", "description": "...", "type": "standards|legal"}],
  "legalRequirements": {
    "requiredSubjects": [],
    "instructionalHours": "",
    "assessmentRequirements": "",
    "recordKeeping": "",
    "notification": "",
    "exemptions": "",
    "documentation": []
  },
  "notes": ""
}`;

    const researchResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert on US education standards and homeschool regulations.' },
          { role: 'user', content: researchPrompt }
        ],
      }),
    });

    if (!researchResponse.ok) {
      throw new Error(`Research API error: ${researchResponse.status}`);
    }

    const researchData = await researchResponse.json();
    const researchText = researchData.choices[0].message.content;
    
    // Try to parse JSON from response
    let researchResults;
    try {
      const jsonMatch = researchText.match(/\{[\s\S]*\}/);
      researchResults = jsonMatch ? JSON.parse(jsonMatch[0]) : { notes: researchText };
    } catch {
      researchResults = { notes: researchText };
    }

    // Phase 2: Extract/generate standards based on sources
    const standardsPrompt = `Based on the research for ${requirements.state} grade ${requirements.grade}, you must generate a COMPREHENSIVE and COMPLETE list of educational standards for ${requirements.subjects?.join(', ') || 'core subjects'}.

CRITICAL REQUIREMENTS:
- This is for homeschool compliance and educational planning - it MUST be thorough
- Generate AT LEAST 100-300 standards PER SUBJECT (not total)
- Cover ALL domains/strands within each subject
- Include prerequisite knowledge from earlier grades when relevant
- Include advanced concepts that build toward next grade level

For EACH subject requested, ensure you cover:
Mathematics: Number & Operations, Algebra, Geometry, Measurement, Data Analysis, Mathematical Practices
English/Language Arts: Reading Literature, Reading Informational, Writing, Speaking & Listening, Language
Science: Physical Science, Life Science, Earth/Space Science, Engineering & Design
Social Studies: History, Geography, Civics, Economics

For each standard provide:
- code: Official standard code (e.g., "CCSS.MATH.8.NS.A.1", "CCSS.ELA-LITERACY.RL.8.1")
- subject: Subject area
- domain: Domain/strand within subject  
- text: Full standard text (detailed description of what students should know/do)
- gradeLevel: Grade level

Generate a COMPLETE, COMPREHENSIVE framework with hundreds of standards that would satisfy state homeschool requirements and provide a rigorous education.`;

    const standardsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: 'You are an expert on educational standards and homeschool compliance. You must generate COMPREHENSIVE frameworks with hundreds of standards covering all domains. Be thorough - parents need complete coverage for legal compliance and quality education.' },
          { role: 'user', content: standardsPrompt }
        ],
        temperature: 0.7,
        max_tokens: 16000,
      }),
    });

    if (!standardsResponse.ok) {
      throw new Error(`Standards API error: ${standardsResponse.status}`);
    }

    const standardsData = await standardsResponse.json();
    const standardsText = standardsData.choices[0].message.content;
    
    let compiledStandards = [];
    try {
      const jsonMatch = standardsText.match(/\[[\s\S]*\]/);
      compiledStandards = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.error('Failed to parse standards:', e);
    }

    // Update session
    const { error: updateError } = await supabase
      .from('standards_planning_sessions')
      .update({
        status: 'reviewing',
        research_results: researchResults,
        legal_requirements: researchResults.legalRequirements || {},
        compiled_standards: compiledStandards,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        researchResults,
        compiledStandards,
        legalRequirements: researchResults.legalRequirements
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});