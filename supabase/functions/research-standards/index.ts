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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Researching standards for:', requirements);

    // Phase 1: Identify official sources to scrape
    const sourcePrompt = `You are helping identify official government education standards sources to scrape.

State: ${requirements.state || 'Not specified'}
Grade Level: ${requirements.grade || 'Not specified'}
Subjects: ${requirements.subjects?.join(', ') || 'All core subjects'}

Provide URLs for:
1. Official state department of education standards documents (PDFs, HTML pages)
2. State homeschool legal requirements pages
3. Common Core or state-specific standards repositories

Format as JSON:
{
  "standardsSources": [
    {"url": "https://...", "subject": "Math", "format": "pdf|html", "description": "..."},
    {"url": "https://...", "subject": "ELA", "format": "pdf|html", "description": "..."}
  ],
  "legalSources": [
    {"url": "https://...", "type": "requirements", "description": "..."}
  ]
}`;

    const sourceResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert on US state education departments and official standards repositories. Provide real, scrapable URLs.' },
          { role: 'user', content: sourcePrompt }
        ],
      }),
    });

    if (!sourceResponse.ok) {
      throw new Error(`Source identification error: ${sourceResponse.status}`);
    }

    const sourceData = await sourceResponse.json();
    const sourceText = sourceData.choices[0].message.content;
    
    let sources;
    try {
      const jsonMatch = sourceText.match(/\{[\s\S]*\}/);
      sources = jsonMatch ? JSON.parse(jsonMatch[0]) : { standardsSources: [], legalSources: [] };
    } catch {
      sources = { standardsSources: [], legalSources: [] };
    }

    console.log('Identified sources:', sources);

    // Phase 2: Scrape each source
    const scrapedContent: any[] = [];
    const maxSources = 5; // Limit to prevent timeout
    const sourcesToScrape = [...sources.standardsSources.slice(0, maxSources), ...sources.legalSources.slice(0, 2)];

    for (const source of sourcesToScrape) {
      try {
        console.log(`Scraping: ${source.url}`);
        
        // Use Firecrawl-style scraping with Lovable AI
        const scrapeResponse = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (scrapeResponse.ok) {
          const html = await scrapeResponse.text();
          scrapedContent.push({
            url: source.url,
            subject: source.subject || 'legal',
            content: html.slice(0, 50000), // Limit content size
            description: source.description
          });
          console.log(`Successfully scraped: ${source.url}`);
        } else {
          console.log(`Failed to scrape ${source.url}: ${scrapeResponse.status}`);
        }
      } catch (error) {
        console.error(`Error scraping ${source.url}:`, error);
      }
    }

    // Phase 3: Extract legal requirements from scraped content
    const legalContent = scrapedContent.filter(s => s.subject === 'legal').map(s => s.content).join('\n\n').slice(0, 30000);
    
    const legalPrompt = `Extract homeschool legal requirements from this scraped content:

${legalContent}

Format as JSON:
{
  "requiredSubjects": ["Math", "Science", ...],
  "instructionalHours": "180 days or 900 hours",
  "assessmentRequirements": "...",
  "recordKeeping": "...",
  "notification": "...",
  "exemptions": "...",
  "documentation": ["attendance records", "grade reports", ...]
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
          { role: 'system', content: 'Extract structured legal requirements from homeschool regulation documents.' },
          { role: 'user', content: legalPrompt }
        ],
      }),
    });

    const legalData = await legalResponse.json();
    const legalText = legalData.choices[0].message.content;
    
    let legalRequirements;
    try {
      const jsonMatch = legalText.match(/\{[\s\S]*\}/);
      legalRequirements = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      legalRequirements = {};
    }

    // Phase 4: Extract standards from scraped content
    const standardsContent = scrapedContent.filter(s => s.subject !== 'legal');
    const compiledStandards: any[] = [];

    for (const source of standardsContent) {
      const extractPrompt = `Extract ALL educational standards from this scraped content for ${source.subject}:

${source.content.slice(0, 40000)}

CRITICAL: Extract EVERY SINGLE standard you find. Do not summarize. Do not skip any.
For each standard provide:
- code: Official code
- subject: Subject area
- domain: Domain/strand
- text: Full standard text
- gradeLevel: Grade level

Return as JSON array with ALL standards found.`;

      const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'Extract ALL standards from educational documents. Be comprehensive - extract every single standard you find.' },
            { role: 'user', content: extractPrompt }
          ],
          max_completion_tokens: 16000,
        }),
      });

      const extractData = await extractResponse.json();
      const extractText = extractData.choices[0].message.content;
      
      try {
        const jsonMatch = extractText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0]);
          compiledStandards.push(...extracted);
          console.log(`Extracted ${extracted.length} standards from ${source.url}`);
        }
      } catch (e) {
        console.error('Failed to parse extracted standards:', e);
      }
    }

    console.log(`Total standards extracted: ${compiledStandards.length}`);

    const researchResults = {
      sources: scrapedContent.map(s => ({ url: s.url, description: s.description })),
      standardsCount: compiledStandards.length,
      scrapedUrls: scrapedContent.map(s => s.url)
    };

    // Update session
    const { error: updateError } = await supabase
      .from('standards_planning_sessions')
      .update({
        status: 'reviewing',
        research_results: researchResults,
        legal_requirements: legalRequirements,
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
        legalRequirements
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