import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RDFValue {
  type: string;
  value: string;
}

interface RDFResource {
  [key: string]: RDFValue[];
}

interface RDFDocument {
  [uri: string]: RDFResource;
}

interface Standard {
  code: string;
  text: string;
  framework: string;
  subject: string;
  grade_band: string;
  parent_code: string | null;
  region: string;
}

// Extract value from RDF array
function extractValue(values?: RDFValue[]): string | null {
  if (!values || values.length === 0) return null;
  return values[0]?.value || null;
}

// Extract grade band from education level URIs
function extractGradeBand(educationLevels?: RDFValue[]): string {
  if (!educationLevels || educationLevels.length === 0) return 'K-12';
  
  const grades: number[] = [];
  for (const level of educationLevels) {
    const uri = level.value;
    // Extract grade numbers from URIs like http://purl.org/ASN/scheme/ASNEducationLevel/K
    const match = uri.match(/\/([KP0-9]+)$/);
    if (match) {
      const grade = match[1];
      if (grade === 'K' || grade === 'P') {
        grades.push(0);
      } else {
        const num = parseInt(grade);
        if (!isNaN(num)) grades.push(num);
      }
    }
  }
  
  if (grades.length === 0) return 'K-12';
  
  const min = Math.min(...grades);
  const max = Math.max(...grades);
  
  if (min === max) {
    return min === 0 ? 'K' : min.toString();
  }
  
  const minStr = min === 0 ? 'K' : min.toString();
  const maxStr = max === 0 ? 'K' : max.toString();
  return `${minStr}-${maxStr}`;
}

// Extract parent code from reference URI
function extractParentCode(parentRefs?: RDFValue[]): string | null {
  if (!parentRefs || parentRefs.length === 0) return null;
  const uri = parentRefs[0].value;
  // Extract ID from URI like http://asn.desire2learn.com/resources/S1143445
  const match = uri.match(/\/([^\/]+)$/);
  return match ? match[1] : null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { jsonContent, subject, framework = 'CA CCSS' } = await req.json();

    if (!jsonContent || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing jsonContent or subject' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${subject} standards from uploaded JSON`);

    // Parse the RDF/JSON document
    const doc: RDFDocument = JSON.parse(jsonContent);
    const resources = Object.entries(doc);
    
    console.log(`Received ${resources.length} resources`);

    const standards: Standard[] = [];
    const codeToId: { [code: string]: string } = {};

    // First pass: collect all standards with codes
    for (const [uri, resource] of resources) {
      const type = extractValue(resource['http://www.w3.org/1999/02/22-rdf-syntax-ns#type']);
      
      // Only process Statement types
      if (type !== 'http://purl.org/ASN/schema/core/Statement') continue;

      // Try statementNotation first, then fall back to listID (used in CTE standards)
      const code = extractValue(resource['http://purl.org/ASN/schema/core/statementNotation']) ||
                   extractValue(resource['http://purl.org/ASN/schema/core/listID']);
      
      // Skip if no code (these are organizational nodes)
      if (!code) continue;

      const text = extractValue(resource['http://purl.org/dc/terms/description']) ||
                   extractValue(resource['http://purl.org/ASN/schema/core/comment']);
      if (!text) continue;

      const educationLevels = resource['http://purl.org/ASN/schema/core/educationLevel'];
      const gradeBand = extractGradeBand(educationLevels);

      const parentRefs = resource['http://purl.org/gem/qualifiers/isChildOf'];
      const parentUri = parentRefs?.[0]?.value || null;

      // Store mapping for parent resolution
      codeToId[uri] = code;

      standards.push({
        code,
        text,
        framework,
        subject,
        grade_band: gradeBand,
        parent_code: parentUri, // Will resolve in second pass
        region: 'California'
      });
    }

    console.log(`Parsed ${standards.length} standards with codes`);

    // Second pass: resolve parent codes
    for (const standard of standards) {
      if (standard.parent_code) {
        const parentCode = codeToId[standard.parent_code];
        standard.parent_code = parentCode || null;
      }
    }

    // Insert standards in batches
    const batchSize = 100;
    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < standards.length; i += batchSize) {
      const batch = standards.slice(i, i + batchSize);
      
      // Check which standards already exist
      const codes = batch.map(s => s.code);
      const { data: existing } = await supabase
        .from('standards')
        .select('code')
        .eq('framework', framework)
        .in('code', codes);
      
      const existingCodes = new Set(existing?.map(e => e.code) || []);
      const newStandards = batch.filter(s => !existingCodes.has(s.code));
      
      skipped += existingCodes.size;
      
      if (newStandards.length > 0) {
        const { error } = await supabase
          .from('standards')
          .insert(newStandards);

        if (error) {
          console.error(`Batch ${i / batchSize + 1} error:`, error);
          failed += newStandards.length;
        } else {
          imported += newStandards.length;
        }
      }
    }

    const result = {
      success: true,
      imported,
      skipped,
      failed,
      total: standards.length,
      subject,
      framework
    };

    console.log('Import completed:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
