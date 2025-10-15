import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// California ASN Document IDs (verified from asn.desire2learn.com)
const CALIFORNIA_DOCUMENTS = {
  'Mathematics': ['D10003FC'], // CCSS Math
  'English Language Arts': ['D2451F42'], // CCSS ELA
  'Science': ['D2454348'], // NGSS
  'History-Social Science': ['D2605750'], // CA HSS
};

interface ASNStatement {
  '@id': string;
  '@type': string;
  'asn:statementNotation'?: string;
  'dcterms:description'?: string;
  'asn:educationLevel'?: string[];
  'dcterms:subject'?: string;
  'gemq:isChildOf'?: { '@id': string };
}

interface ASNDocument {
  '@context': any;
  '@graph': ASNStatement[];
}

const extractGradeBand = (educationLevels?: string[]): string => {
  if (!educationLevels || educationLevels.length === 0) return 'K-12';
  
  const levels = educationLevels.map(l => {
    if (l === 'K' || l === '0') return 0;
    return parseInt(l) || 0;
  }).filter(l => l >= 0);
  
  if (levels.length === 0) return 'K-12';
  
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  
  if (min === max) return min === 0 ? 'K' : `${min}`;
  return `${min === 0 ? 'K' : min}-${max}`;
};

const extractParentCode = (parent?: { '@id': string }): string | null => {
  if (!parent) return null;
  const parts = parent['@id'].split('/');
  return parts[parts.length - 1];
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subjects } = await req.json();
    const subjectsToImport = subjects || Object.keys(CALIFORNIA_DOCUMENTS);

    console.log(`Importing California standards for subjects: ${subjectsToImport.join(', ')}`);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = {
      imported: 0,
      skipped: 0,
      failed: 0,
      details: [] as any[],
    };

    for (const subject of subjectsToImport) {
      const documentIds = CALIFORNIA_DOCUMENTS[subject as keyof typeof CALIFORNIA_DOCUMENTS];
      
      if (!documentIds) {
        console.log(`No document IDs found for subject: ${subject}`);
        results.skipped++;
        results.details.push({
          subject,
          status: 'skipped',
          reason: 'No document IDs configured'
        });
        continue;
      }

      for (const docId of documentIds) {
        try {
          const asnUrl = `https://asn.desire2learn.com/resources/${docId}.json`;
          console.log(`Fetching ${subject} from ${asnUrl}...`);

          const response = await fetch(asnUrl);
          
          if (!response.ok) {
            console.error(`Failed to fetch ${docId}: ${response.status}`);
            results.failed++;
            results.details.push({
              subject,
              document: docId,
              status: 'failed',
              error: `HTTP ${response.status}`
            });
            continue;
          }

          const asnData: ASNDocument = await response.json();
          console.log(`Received ${asnData['@graph']?.length || 0} items for ${subject}`);

          const standards: any[] = [];
          
          // Parse ASN JSON-LD format
          for (const item of asnData['@graph'] || []) {
            // Only process Statement types (actual standards)
            if (item['@type'] !== 'asn:Statement') continue;
            
            const code = item['asn:statementNotation'];
            const text = item['dcterms:description'];
            
            if (!code || !text) continue;

            standards.push({
              code: code,
              text: text,
              subject: subject,
              grade_band: extractGradeBand(item['asn:educationLevel']),
              framework: 'CA-CCSS',
              region: 'California',
              parent_code: extractParentCode(item['gemq:isChildOf']),
              metadata: {
                asn_id: item['@id'],
                document_id: docId,
                asn_uri: item['@id']
              }
            });
          }

          console.log(`Parsed ${standards.length} standards for ${subject} (${docId})`);

          if (standards.length === 0) {
            results.skipped++;
            results.details.push({
              subject,
              document: docId,
              status: 'skipped',
              reason: 'No standards found in document'
            });
            continue;
          }

          // Insert standards in batches
          const batchSize = 100;
          let inserted = 0;
          let skipped = 0;
          
          for (let i = 0; i < standards.length; i += batchSize) {
            const batch = standards.slice(i, i + batchSize);
            
            const { data, error } = await supabaseClient
              .from('standards')
              .upsert(batch, { 
                onConflict: 'code,framework',
                ignoreDuplicates: false 
              })
              .select();

            if (error) {
              console.error(`Error inserting batch for ${subject}:`, error);
            } else {
              const actualInserted = data?.length || 0;
              inserted += actualInserted;
              skipped += (batch.length - actualInserted);
            }
          }

          results.imported += inserted;
          if (skipped > 0) results.skipped += skipped;
          
          results.details.push({
            subject,
            document: docId,
            status: 'success',
            imported: inserted,
            skipped: skipped
          });

        } catch (error) {
          console.error(`Error processing ${subject} (${docId}):`, error);
          results.failed++;
          results.details.push({
            subject,
            document: docId,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
          });
        }
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
