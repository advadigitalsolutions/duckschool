import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUBJECTS = [
  'Mathematics',
  'Science',
  'History/Social Studies',
  'English/Language Arts'
];

const GRADE_BANDS = ['9-10', '11-12'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { subject, gradeBand } = await req.json();
    
    // If no params, seed all subjects and grades
    const subjectsToSeed = subject ? [subject] : SUBJECTS;
    const gradesToSeed = gradeBand ? [gradeBand] : GRADE_BANDS;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = [];

    for (const subj of subjectsToSeed) {
      for (const grade of gradesToSeed) {
        console.log(`Generating CA-CCSS standards for ${subj} grade ${grade}...`);

        const systemPrompt = `You are an expert in California Common Core State Standards (CA-CCSS). Generate authentic, comprehensive standards for the specified subject and grade level.`;

        const userPrompt = `Generate 15-25 CA-CCSS standards for:
- Subject: ${subj}
- Grade Band: ${grade}

Requirements:
- Use authentic CA-CCSS code format (e.g., "CCSS.MATH.CONTENT.HSA.SSE.A.1" for math, "CCSS.ELA-LITERACY.RL.9-10.1" for ELA)
- Include standards from multiple domains/strands within the subject
- Each standard should have a clear, specific learning objective
- Provide comprehensive coverage of the subject for this grade level
- For Mathematics: Include Algebra, Geometry, Functions, Statistics, etc.
- For Science: Include domains like Physical Science, Life Science, Earth Science, Engineering
- For History/Social Studies: Include historical thinking, geography, civics, economics
- For ELA: Include Reading, Writing, Speaking & Listening, Language

Return ONLY a JSON array with this structure:
[
  {
    "code": "CCSS.STANDARD.CODE.HERE",
    "text": "Clear description of what students should know/do",
    "domain": "Domain or strand name"
  }
]`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          throw new Error(`AI API error: ${aiResponse.status} - ${errorText}`);
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('No content in AI response');
        }

        // Parse JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('Could not find JSON array in response');
        }

        const standards = JSON.parse(jsonMatch[0]);

        // Insert standards into database
        const standardsToInsert = standards.map((s: any) => ({
          framework: 'CA-CCSS',
          code: s.code,
          text: s.text,
          subject: subj,
          grade_band: grade,
          metadata: { domain: s.domain || null }
        }));

        // Check if standards already exist
        const { data: existing } = await supabase
          .from('standards')
          .select('code')
          .eq('framework', 'CA-CCSS')
          .eq('subject', subj)
          .eq('grade_band', grade);

        const existingCodes = new Set(existing?.map(s => s.code) || []);
        const newStandards = standardsToInsert.filter((s: any) => !existingCodes.has(s.code));

        if (newStandards.length > 0) {
          const { error: insertError } = await supabase
            .from('standards')
            .insert(newStandards);

          if (insertError) {
            console.error('Insert error:', insertError);
            throw insertError;
          }

          results.push({
            subject: subj,
            gradeBand: grade,
            inserted: newStandards.length,
            skipped: standardsToInsert.length - newStandards.length
          });
        } else {
          results.push({
            subject: subj,
            gradeBand: grade,
            inserted: 0,
            skipped: standardsToInsert.length,
            message: 'All standards already exist'
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        totalInserted: results.reduce((sum, r) => sum + r.inserted, 0)
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
