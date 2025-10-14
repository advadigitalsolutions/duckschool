import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Scrape standards from CDE's searchable database
async function scrapeStandardsFromCDE(subject: string, minGrade: number, maxGrade: number) {
  const baseUrl = 'https://www2.cde.ca.gov/cacs/';
  const urls: Record<string, string> = {
    'Mathematics': `${baseUrl}math?c0=&c1=&c2=&min=${minGrade}&max=${maxGrade}&results=100`,
    'English/Language Arts': `${baseUrl}ela?c0=&c1=&c2=&min=${minGrade}&max=${maxGrade}&results=100`,
    'Science': `${baseUrl}science?c0=&c1=&c2=&min=${minGrade}&max=${maxGrade}&results=100`,
    'History/Social Studies': `${baseUrl}history?c0=&c1=&c2=&min=${minGrade}&max=${maxGrade}&results=100`,
  };

  const url = urls[subject];
  if (!url) throw new Error(`Unknown subject: ${subject}`);

  console.log(`Fetching from: ${url}`);
  const response = await fetch(url);
  const html = await response.text();

  // Parse HTML to extract standards
  const standards: any[] = [];
  
  // Extract standard blocks (this is a simplified parser - real implementation would be more robust)
  const standardPattern = /<div class="standard-block"[\s\S]*?<\/div>/gi;
  const matches = html.match(standardPattern) || [];

  for (const match of matches) {
    // Extract standard code
    const codeMatch = match.match(/Standard Identifier:\s*<\/strong>\s*([A-Z0-9\.\-]+)/i);
    const code = codeMatch ? codeMatch[1].trim() : null;

    // Extract standard text
    const textMatch = match.match(/Standard:\s*<\/strong>\s*([\s\S]*?)(?:<div|$)/i);
    const text = textMatch ? textMatch[1].replace(/<[^>]+>/g, '').trim() : null;

    // Extract domain
    const domainMatch = match.match(/Domain:\s*<\/strong>\s*([^<]+)/i);
    const domain = domainMatch ? domainMatch[1].trim() : null;

    // Extract grade band
    const gradeMatch = match.match(/Grade:\s*<\/strong>\s*([^<]+)/i);
    const gradeBand = gradeMatch ? gradeMatch[1].trim() : `${minGrade}-${maxGrade}`;

    if (code && text) {
      standards.push({
        framework: 'CA-CCSS',
        code,
        text,
        subject,
        grade_band: gradeBand,
        metadata: { domain: domain || null }
      });
    }
  }

  return standards;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { grades = ['9-10', '11-12'] } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const allStandards: any[] = [];
    const subjects = ['Mathematics', 'English/Language Arts', 'Science', 'History/Social Studies'];

    // Scrape each subject for each grade band
    for (const subject of subjects) {
      for (const gradeBand of grades) {
        const [minGrade, maxGrade] = gradeBand.split('-').map(Number);
        console.log(`Scraping ${subject} for grades ${gradeBand}...`);
        
        try {
          const standards = await scrapeStandardsFromCDE(subject, minGrade, maxGrade);
          allStandards.push(...standards);
          console.log(`Found ${standards.length} standards for ${subject} ${gradeBand}`);
        } catch (error) {
          console.error(`Error scraping ${subject} ${gradeBand}:`, error);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Insert into database (avoid duplicates)
    const { data: existing } = await supabase
      .from('standards')
      .select('code')
      .eq('framework', 'CA-CCSS');

    const existingCodes = new Set(existing?.map(s => s.code) || []);
    const newStandards = allStandards.filter(s => !existingCodes.has(s.code));

    let inserted = 0;
    if (newStandards.length > 0) {
      // Insert in batches of 100
      for (let i = 0; i < newStandards.length; i += 100) {
        const batch = newStandards.slice(i, i + 100);
        const { error } = await supabase.from('standards').insert(batch);
        if (error) throw error;
        inserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scraped: allStandards.length,
        inserted,
        skipped: allStandards.length - inserted
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
