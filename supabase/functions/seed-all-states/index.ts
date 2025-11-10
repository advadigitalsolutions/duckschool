import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALL_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const CORE_SUBJECTS = ['Mathematics', 'English Language Arts', 'Science', 'Social Studies'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { states, gradeLevels, subjects, batchSize = 1 } = await req.json();
    
    const statesToProcess = states || ALL_STATES;
    const gradesToProcess = gradeLevels || GRADE_LEVELS;
    const subjectsToProcess = subjects || CORE_SUBJECTS;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Starting seed process for ${statesToProcess.length} states, ${gradesToProcess.length} grades, ${subjectsToProcess.length} subjects`);
    
    const results = {
      success: [] as any[],
      failed: [] as any[],
      skipped: [] as any[],
    };

    let processed = 0;
    const total = statesToProcess.length * gradesToProcess.length * subjectsToProcess.length;

    for (const state of statesToProcess) {
      for (const grade of gradesToProcess) {
        for (const subject of subjectsToProcess) {
          processed++;
          console.log(`[${processed}/${total}] Processing ${state} - Grade ${grade} - ${subject}`);

          // Check if already exists
          const { data: existing } = await supabase
            .from('standards_library')
            .select('id')
            .eq('state', state)
            .eq('grade_level', grade)
            .eq('subject', subject)
            .maybeSingle();

          if (existing) {
            console.log(`Skipping - already exists`);
            results.skipped.push({ state, grade, subject });
            continue;
          }

          try {
            // Phase 1: Use AI to identify official sources
            const sourcePrompt = `You are a research assistant helping identify official state education standards.

State: ${state}
Grade Level: ${grade}
Subject: ${subject}

Identify the official ${state} Department of Education standards documents for ${subject} at grade ${grade}.

Provide:
1. Direct URLs to PDF or web resources containing the official standards
2. Any relevant legal or homeschool reporting requirements for ${state}

Return ONLY a JSON object with this structure:
{
  "standards_sources": [
    {"url": "https://...", "description": "Official state standards PDF"}
  ],
  "legal_sources": [
    {"url": "https://...", "description": "Homeschool legal requirements"}
  ]
}`;

            const sourcesResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: 'You are a research assistant. Always return valid JSON.' },
                  { role: 'user', content: sourcePrompt }
                ],
              }),
            });

            if (!sourcesResponse.ok) {
              throw new Error(`AI API failed: ${sourcesResponse.status}`);
            }

            const sourcesData = await sourcesResponse.json();
            const sourcesText = sourcesData.choices[0].message.content;
            
            let sources;
            try {
              const jsonMatch = sourcesText.match(/\{[\s\S]*\}/);
              sources = jsonMatch ? JSON.parse(jsonMatch[0]) : { standards_sources: [], legal_sources: [] };
            } catch (e) {
              console.error('Failed to parse AI response:', e);
              sources = { standards_sources: [], legal_sources: [] };
            }

            console.log(`Found ${sources.standards_sources?.length || 0} standards sources`);

            // Phase 2: Scrape content from identified sources (limited to first 3)
            const scrapedContent: string[] = [];
            const sourceUrls: string[] = [];

            for (const source of (sources.standards_sources || []).slice(0, 3)) {
              try {
                console.log(`Scraping: ${source.url}`);
                const scrapeResponse = await fetch(source.url, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (Educational Standards Scraper)' }
                });
                
                if (scrapeResponse.ok) {
                  const content = await scrapeResponse.text();
                  scrapedContent.push(content.substring(0, 50000)); // Limit content size
                  sourceUrls.push(source.url);
                }
              } catch (e) {
                console.error(`Failed to scrape ${source.url}:`, e);
              }
            }

            // Phase 3: Extract legal requirements
            let legalRequirements = {};
            if (sources.legal_sources && sources.legal_sources.length > 0) {
              const legalPrompt = `Extract homeschool legal requirements for ${state}.

Based on these sources:
${sources.legal_sources.map((s: any) => `- ${s.url}: ${s.description}`).join('\n')}

Return a JSON object categorizing requirements like:
{
  "attendance": ["requirement 1", "requirement 2"],
  "assessment": ["requirement 1"],
  "notification": ["requirement 1"]
}`;

              const legalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${openaiApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'gpt-4o-mini',
                  messages: [
                    { role: 'system', content: 'Extract legal requirements. Return valid JSON only.' },
                    { role: 'user', content: legalPrompt }
                  ],
                }),
              });

              if (legalResponse.ok) {
                const legalData = await legalResponse.json();
                const legalText = legalData.choices[0].message.content;
                try {
                  const jsonMatch = legalText.match(/\{[\s\S]*\}/);
                  legalRequirements = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
                } catch (e) {
                  console.error('Failed to parse legal requirements:', e);
                }
              }
            }

            // Phase 4: Extract standards from scraped content
            const standardsPrompt = `Extract educational standards from this content for ${state} Grade ${grade} ${subject}.

Content snippets:
${scrapedContent.map((c, i) => `Source ${i + 1}: ${c.substring(0, 5000)}`).join('\n\n')}

Return a JSON array of standards with this structure:
[
  {
    "code": "3.OA.A.1",
    "text": "Standard description",
    "subject": "${subject}",
    "domain": "Operations and Algebraic Thinking",
    "grade_level": "${grade}"
  }
]

Extract as many relevant standards as you can find. Return ONLY the JSON array.`;

            const standardsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                  { role: 'system', content: 'You are a standards extraction expert. Return valid JSON only.' },
                  { role: 'user', content: standardsPrompt }
                ],
              }),
            });

            if (!standardsResponse.ok) {
              throw new Error(`Standards extraction failed: ${standardsResponse.status}`);
            }

            const standardsData = await standardsResponse.json();
            const standardsText = standardsData.choices[0].message.content;
            
            let extractedStandards = [];
            try {
              const jsonMatch = standardsText.match(/\[[\s\S]*\]/);
              extractedStandards = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
            } catch (e) {
              console.error('Failed to parse extracted standards:', e);
            }

            console.log(`Extracted ${extractedStandards.length} standards`);

            // Store in database
            if (extractedStandards.length > 0) {
              const { error: insertError } = await supabase
                .from('standards_library')
                .insert({
                  state,
                  grade_level: grade,
                  subject,
                  framework: 'State Standards',
                  standards: extractedStandards,
                  legal_requirements: legalRequirements,
                  source_urls: sourceUrls,
                  verified: false, // Manual verification recommended
                });

              if (insertError) {
                throw insertError;
              }

              results.success.push({ state, grade, subject, count: extractedStandards.length });
              console.log(`✓ Successfully seeded ${extractedStandards.length} standards`);
            } else {
              results.failed.push({ state, grade, subject, reason: 'No standards extracted' });
              console.log(`✗ No standards extracted`);
            }

          } catch (error) {
            console.error(`Error processing ${state} - ${grade} - ${subject}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.failed.push({ state, grade, subject, error: errorMessage });
          }

          // Rate limiting: Wait between requests
          if (processed % batchSize === 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          total: processed,
          successful: results.success.length,
          failed: results.failed.length,
          skipped: results.skipped.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in seed-all-states:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
