import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, goals, subject, gradeLevel } = await req.json();

    if (!courseId || !goals || !subject || !gradeLevel) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert curriculum designer. Generate a comprehensive set of learning milestones/standards for a custom course.

The standards should:
1. Break down the course goals into 12-20 specific, measurable learning objectives
2. Be sequenced in logical learning order (foundation → intermediate → advanced)
3. Each standard should represent 5-15 hours of realistic study time (including practice, exercises, and mastery)
4. Cover all aspects needed to achieve the stated goals
5. Be specific enough to create assignments for
6. Follow standard educational objective format
7. Use realistic hour estimates based on the complexity of each objective`;

    const userPrompt = `Create learning standards/milestones for this course:

SUBJECT: ${subject}
GRADE LEVEL: ${gradeLevel}
COURSE GOALS: ${goals}

Generate 12-20 standards that will comprehensively cover what a student needs to learn to achieve these goals. Each standard should be a specific, measurable learning objective with realistic hour estimates (5-15 hours each based on complexity).`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_learning_standards',
              description: 'Generate learning standards for a custom course',
              parameters: {
                type: 'object',
                properties: {
                  standards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        code: { 
                          type: 'string', 
                          description: 'Unique code like CUSTOM-1, CUSTOM-2, etc.' 
                        },
                        text: { 
                          type: 'string', 
                          description: 'The standard/learning objective text' 
                        },
                        sequence: { 
                          type: 'number', 
                          description: 'Order number 1-20' 
                        },
                        estimated_hours: { 
                          type: 'number', 
                          description: 'Estimated hours to master (5-15 based on complexity)' 
                        },
                        category: {
                          type: 'string',
                          description: 'Category like Foundation, Core Skills, Advanced, etc.'
                        }
                      },
                      required: ['code', 'text', 'sequence', 'estimated_hours', 'category'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['standards'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_learning_standards' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call returned from AI');
    }

    const { standards } = JSON.parse(toolCall.function.arguments);

    // Store these as a custom standards scope on the course
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabaseClient
      .from('courses')
      .update({
        standards_scope: [{
          framework: 'CUSTOM',
          subject: subject,
          grade_band: gradeLevel,
          custom_standards: standards,
          generated_at: new Date().toISOString()
        }]
      })
      .eq('id', courseId);

    if (updateError) throw updateError;

    console.log(`Generated ${standards.length} custom standards for course ${courseId}`);

    return new Response(JSON.stringify({ 
      standards,
      count: standards.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error generating standards:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
