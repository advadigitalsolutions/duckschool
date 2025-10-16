import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, oldFramework, newFramework, curriculumItems } = await req.json();
    
    console.log(`Remapping ${curriculumItems.length} curriculum items from ${oldFramework} to ${newFramework}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch course to get subject and new standards scope
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('subject, standards_scope')
      .eq('id', courseId)
      .single();

    if (courseError) throw courseError;

    // Get available new standards
    let newStandards = [];
    if (newFramework === 'CUSTOM') {
      // Use custom standards from standards_scope
      newStandards = course.standards_scope?.[0]?.custom_standards || [];
    } else {
      // Fetch regional standards from standards table
      const { data: regionalStandards, error: standardsError } = await supabase
        .from('standards')
        .select('code, text, grade_band')
        .eq('framework', newFramework)
        .eq('subject', course.subject);
      
      if (standardsError) throw standardsError;
      newStandards = regionalStandards || [];
    }

    if (newStandards.length === 0) {
      throw new Error(`No standards found for framework: ${newFramework}`);
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    // Process items in batches to avoid rate limits
    const BATCH_SIZE = 5;
    const results: Array<{
      id: string;
      title: string;
      oldStandards?: any[];
      newStandards?: any[];
      success: boolean;
      error?: string;
    }> = [];
    let remappedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < curriculumItems.length; i += BATCH_SIZE) {
      const batch = curriculumItems.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (item: any) => {
        try {
          // Extract lesson content from body
          let lessonContent = '';
          if (item.body?.blocks) {
            lessonContent = item.body.blocks
              .map((block: any) => block.data?.text || '')
              .join('\n');
          }

          // Build old standards description
          const oldStandardsDesc = (item.standards || [])
            .map((code: string) => `- ${code}`)
            .join('\n');

          // Build new standards list
          const newStandardsList = newStandards
            .map((std: any) => `- ${std.code}: ${std.text}`)
            .join('\n');

          const prompt = `You are a curriculum standards mapper. Given this lesson content and its OLD standards, map it to the MOST RELEVANT standards in the NEW framework.

OLD FRAMEWORK: ${oldFramework}
OLD STANDARDS:
${oldStandardsDesc || 'None specified'}

NEW FRAMEWORK: ${newFramework}
AVAILABLE NEW STANDARDS:
${newStandardsList}

LESSON TITLE: ${item.title}
LESSON CONTENT:
${lessonContent.substring(0, 2000)}

Return ONLY a JSON array of standard codes that best match this lesson:
["CODE1", "CODE2", "CODE3"]

Rules:
- Select 1-5 most relevant standards
- Prioritize conceptual alignment over exact wording
- If no good match exists, return empty array []
- Return ONLY the JSON array, no other text`;

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-5-mini-2025-08-07',
              messages: [
                { role: 'user', content: prompt }
              ],
            }),
          });

          if (!response.ok) {
            throw new Error(`AI API error: ${response.status}`);
          }

          const data = await response.json();
          const aiResponse = data.choices[0].message.content;
          
          // Parse AI response - extract JSON array
          let newStandardCodes = [];
          try {
            const jsonMatch = aiResponse.match(/\[.*?\]/s);
            if (jsonMatch) {
              newStandardCodes = JSON.parse(jsonMatch[0]);
            }
          } catch (parseError) {
            console.error('Failed to parse AI response:', aiResponse);
            throw parseError;
          }

          // Update curriculum item with new standards
          const { error: updateError } = await supabase
            .from('curriculum_items')
            .update({ standards: newStandardCodes })
            .eq('id', item.id);

          if (updateError) throw updateError;

          results.push({
            id: item.id,
            title: item.title,
            oldStandards: item.standards,
            newStandards: newStandardCodes,
            success: true
          });
          remappedCount++;
          console.log(`✓ Remapped: ${item.title} -> ${newStandardCodes.length} new standards`);
        } catch (error) {
          console.error(`✗ Failed to remap ${item.title}:`, error);
          results.push({
            id: item.id,
            title: item.title,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          failedCount++;
        }
      }));

      // Add delay between batches to avoid rate limits
      if (i + BATCH_SIZE < curriculumItems.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return new Response(
      JSON.stringify({
        remappedCount,
        failedCount,
        total: curriculumItems.length,
        details: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in remap-curriculum-standards:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
