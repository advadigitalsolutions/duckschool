import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dryRun = true } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log(`Starting legacy content enrichment (dry run: ${dryRun})...`);

    // Find all curriculum items with vague/missing student instructions
    const { data: items, error: fetchError } = await supabase
      .from('curriculum_items')
      .select('id, title, body, type')
      .not('body', 'is', null);

    if (fetchError) throw fetchError;

    const itemsNeedingEnrichment = items?.filter(item => {
      const body = item.body as any;
      const instructions = body?.student_instructions;
      
      // Needs enrichment if:
      // 1. No student_instructions field
      // 2. Instructions are too short (< 100 chars)
      // 3. Instructions don't have numbered steps
      if (!instructions) return true;
      if (Array.isArray(instructions) && instructions.length < 3) return true;
      if (typeof instructions === 'string') {
        if (instructions.length < 100) return true;
        if (!instructions.match(/\d+\./)) return true; // No numbered list
      }
      
      return false;
    }) || [];

    console.log(`Found ${itemsNeedingEnrichment.length} items needing enrichment`);

    const results = [];

    for (const item of itemsNeedingEnrichment.slice(0, 10)) { // Process 10 at a time
      try {
        const body = item.body as any;
        
        // Generate detailed student instructions from existing content
        const prompt = `Generate detailed, ADHD-friendly student instructions for this assignment.

ASSIGNMENT:
Title: ${item.title}
Type: ${item.type}
Description: ${body.description || 'No description'}
Objectives: ${body.objectives?.join(', ') || 'No objectives'}
Materials: ${body.materials?.join(', ') || 'No materials'}

REQUIREMENTS:
1. Create 5-15 numbered micro-tasks
2. Each task should be 5-10 minutes
3. Format: "**Step X: [Action]** (X min) - Clear, specific instructions"
4. Include time estimates in parentheses
5. Make each step concrete and actionable
6. Use ADHD-friendly language (short, clear, directive)

Return ONLY a JSON array of strings, no additional text:
["**Step 1: ...**", "**Step 2: ...**", ...]`;

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You generate detailed task breakdowns for educational assignments.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_completion_tokens: 800,
          }),
        });

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI error: ${openaiResponse.status}`);
        }

        const data = await openaiResponse.json();
        const content = data.choices[0].message.content;
        
        // Parse the JSON array from the response
        let studentInstructions;
        try {
          // Try to extract JSON array from response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            studentInstructions = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: split by line breaks
            studentInstructions = content.split('\n').filter((line: string) => line.trim());
          }
        } catch (e) {
          console.error('Failed to parse AI response for', item.id);
          studentInstructions = [content]; // Use raw content as fallback
        }

        const updatedBody = {
          ...body,
          student_instructions: studentInstructions
        };

        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('curriculum_items')
            .update({ body: updatedBody })
            .eq('id', item.id);

          if (updateError) throw updateError;
        }

        results.push({
          id: item.id,
          title: item.title,
          status: 'enriched',
          instructionsCount: studentInstructions.length,
          preview: studentInstructions[0]
        });

        console.log(`Enriched: ${item.title} (${studentInstructions.length} steps)`);
        
        // Rate limit: wait 1 second between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error enriching ${item.id}:`, error);
        results.push({
          id: item.id,
          title: item.title,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: dryRun ? 'Dry run complete' : 'Enrichment complete',
        processed: results.length,
        total: itemsNeedingEnrichment.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in enrich-legacy-content:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});