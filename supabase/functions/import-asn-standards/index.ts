import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// California Common Core State Standards Document IDs (verified from ASN)
const CALIFORNIA_DOCUMENTS = {
  'Mathematics': ['D2513639'], // California Common Core State Standards: Mathematics
  'English Language Arts': ['D2513640'], // California Common Core State Standards: English Language Arts
};

// RDF/JSON format interfaces
interface RDFValue {
  value: string;
  type: 'uri' | 'literal';
  lang?: string;
  datatype?: string;
}

interface RDFResource {
  [predicate: string]: RDFValue[];
}

interface RDFDocument {
  [uri: string]: RDFResource;
}

const extractValue = (values?: RDFValue[]): string | null => {
  if (!values || values.length === 0) return null;
  return values[0].value;
};

const extractGradeBand = (educationLevels?: RDFValue[]): string => {
  if (!educationLevels || educationLevels.length === 0) return 'K-12';
  
  const levels = educationLevels.map(level => {
    const gradeStr = level.value.split('/').pop(); // Extract grade from URI
    if (gradeStr === 'K') return 0;
    return parseInt(gradeStr || '0') || 0;
  }).filter(l => l >= 0);
  
  if (levels.length === 0) return 'K-12';
  
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  
  if (min === max) return min === 0 ? 'K' : `${min}`;
  return `${min === 0 ? 'K' : min}-${max}`;
};

const extractParentCode = (parentRefs?: RDFValue[]): string | null => {
  if (!parentRefs || parentRefs.length === 0) return null;
  const parts = parentRefs[0].value.split('/');
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
          // Use standard .json format (not _full.json)
          const asnUrl = `http://asn.desire2learn.com/resources/${docId}.json`;
          console.log(`Fetching ${subject} from ${asnUrl}...`);

          // Add headers to mimic browser request
          const response = await fetch(asnUrl, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; EducationStandardsImporter/1.0)',
            }
          });
          
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

          const asnData: RDFDocument = await response.json();
          const resourceCount = Object.keys(asnData).length;
          console.log(`Received ${resourceCount} resources for ${subject}`);

          const standards: any[] = [];
          
          // Parse RDF/JSON format
          for (const [uri, resource] of Object.entries(asnData)) {
            // Only process Statement types (actual standards)
            const rdfType = resource['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'];
            if (!rdfType || !rdfType.some(t => t.value === 'http://purl.org/ASN/schema/core/Statement')) {
              continue;
            }
            
            const code = extractValue(resource['http://purl.org/ASN/schema/core/statementNotation']);
            const text = extractValue(resource['http://purl.org/dc/terms/description']);
            
            // Skip items without both code and text (these are usually parent nodes)
            if (!code || !text) continue;

            standards.push({
              code: code,
              text: text,
              subject: subject,
              grade_band: extractGradeBand(resource['http://purl.org/dc/terms/educationLevel']),
              framework: 'CA-CCSS',
              region: 'California',
              parent_code: extractParentCode(resource['http://purl.org/gem/qualifiers/isChildOf']),
              metadata: {
                asn_id: uri,
                document_id: docId,
                asn_uri: uri
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
