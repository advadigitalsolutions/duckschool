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
    const { courseTitle, courseSubject, topic, gradeLevel, standards } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating assignment for:', { courseTitle, courseSubject, topic, gradeLevel });

    const systemPrompt = `You are an expert curriculum designer creating detailed, engaging assignments for homeschool students. 
Generate a complete assignment that includes:
1. Clear learning objectives
2. Detailed instructions
3. Required materials/resources
4. Step-by-step activities
5. Assessment rubric with criteria
6. Expected time to complete
7. Differentiation suggestions for ADHD learners

Make it engaging, age-appropriate, and aligned with educational standards.`;

    const userPrompt = `Create a detailed assignment for:
Course: ${courseTitle} (${courseSubject})
Topic: ${topic}
Grade Level: ${gradeLevel}
${standards ? `Standards to address: ${standards}` : ''}

Return a JSON object with this structure:
{
  "title": "Assignment title",
  "objectives": ["objective 1", "objective 2"],
  "instructions": "Detailed step-by-step instructions",
  "materials": ["material 1", "material 2"],
  "activities": [
    {"step": 1, "description": "Activity description", "duration_minutes": 30}
  ],
  "rubric": [
    {"criteria": "Criteria name", "points": 10, "description": "What's expected"}
  ],
  "estimated_minutes": 60,
  "adhd_accommodations": ["accommodation 1", "accommodation 2"]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = JSON.parse(data.choices[0].message.content);
    
    console.log('Generated assignment:', generatedContent);

    return new Response(JSON.stringify(generatedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-assignment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate assignment';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
