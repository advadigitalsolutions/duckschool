import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommonStandard {
  guid: string;
  notation: string;
  statementNotation: string;
  subject: string;
  educationLevels?: string[];
  parent?: {
    guid: string;
  };
  document?: {
    title: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching California standards from Common Standards Project...');

    // Fetch California CCSS standards from the API
    const subjects = ['Math', 'ELA-Literacy'];
    const results = {
      imported: 0,
      skipped: 0,
      failed: 0,
      details: [] as any[],
    };

    for (const subject of subjects) {
      try {
        // Fetch from Common Standards Project API
        const apiUrl = `https://api.commonstandardsproject.com/api/v1/jurisdictions/49FFAAD0-5DF3-11E3-9FE3-CA44E89B0DE5/document_adoptions?subject=${subject}`;
        
        console.log(`Fetching ${subject} standards from ${apiUrl}...`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          console.error(`Failed to fetch ${subject}: ${response.status}`);
          results.failed++;
          results.details.push({
            subject,
            status: 'failed',
            error: `HTTP ${response.status}`
          });
          continue;
        }

        const data = await response.json();
        console.log(`Received data for ${subject}:`, JSON.stringify(data).substring(0, 200));

        // Parse standards from the response
        const standards: any[] = [];
        
        if (data.data && Array.isArray(data.data)) {
          for (const adoption of data.data) {
            if (adoption.document?.standardSets) {
              for (const standardSet of adoption.document.standardSets) {
                if (standardSet.standards) {
                  for (const standard of standardSet.standards) {
                    standards.push({
                      code: standard.notation || standard.statementNotation?.substring(0, 50),
                      text: standard.statementNotation || standard.description || '',
                      subject: subject === 'ELA-Literacy' ? 'English Language Arts' : subject,
                      grade_band: standard.educationLevels?.join(', ') || 'K-12',
                      framework: 'CA-CCSS',
                      region: 'California',
                      metadata: {
                        guid: standard.guid,
                        document: adoption.document?.title,
                        parent_guid: standard.parent?.guid
                      }
                    });
                  }
                }
              }
            }
          }
        }

        console.log(`Parsed ${standards.length} standards for ${subject}`);

        if (standards.length === 0) {
          results.skipped++;
          results.details.push({
            subject,
            status: 'skipped',
            reason: 'No standards found in response'
          });
          continue;
        }

        // Insert standards in batches
        const batchSize = 50;
        let inserted = 0;
        
        for (let i = 0; i < standards.length; i += batchSize) {
          const batch = standards.slice(i, i + batchSize);
          
          const { error } = await supabaseClient
            .from('standards')
            .upsert(batch, { 
              onConflict: 'code,framework',
              ignoreDuplicates: true 
            });

          if (error) {
            console.error(`Error inserting batch for ${subject}:`, error);
          } else {
            inserted += batch.length;
          }
        }

        results.imported += inserted;
        results.details.push({
          subject,
          status: 'success',
          count: inserted
        });

      } catch (error) {
        console.error(`Error processing ${subject}:`, error);
        results.failed++;
        results.details.push({
          subject,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    console.log('Import completed:', results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
