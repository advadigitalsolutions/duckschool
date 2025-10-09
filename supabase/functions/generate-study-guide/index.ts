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
    const { 
      assignment_id, 
      questions, 
      student_profile, 
      reading_materials,
      question_id, // For progressive hints
      current_hint_level = 1,
      existing_hints = []
    } = await req.json();

    console.log('Generating study guide for assignment:', assignment_id);
    console.log('Question count:', questions?.length);
    console.log('Student grade level:', student_profile?.grade_level);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if we already have a cached study guide
    if (!question_id) {
      const { data: cachedGuide } = await supabase
        .from('assignment_study_guides')
        .select('study_guide, generated_at')
        .eq('assignment_id', assignment_id)
        .single();

      // Return cached if less than 24 hours old
      if (cachedGuide && new Date().getTime() - new Date(cachedGuide.generated_at).getTime() < 24 * 60 * 60 * 1000) {
        console.log('Returning cached study guide');
        return new Response(
          JSON.stringify({ study_guide: cachedGuide.study_guide, cached: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const systemPrompt = `You are an educational resource specialist creating study guides that help students learn without giving away answers.

CRITICAL RULES:
1. Link to REAL, reputable educational sources ONLY (Britannica, Khan Academy, YouTube edu channels like CrashCourse/Khan Academy, .edu sites)
2. If reading materials are provided, reference SPECIFIC page numbers where information can be found
3. For math problems, explain the CONCEPT and link to explanations (NOT step-by-step solutions)
4. Provide just enough guidance to point students in the right direction
5. NEVER give the answer directly or make it too obvious
6. Be concise - 2-3 sentences max per hint
7. Use REAL URLs that exist (verify domains: britannica.com, khanacademy.org, youtube.com/@crashcourse, youtube.com/@khanacademy)

TRUSTED SOURCES ONLY:
- Britannica (www.britannica.com)
- Khan Academy (www.khanacademy.org)
- YouTube: CrashCourse, Khan Academy, TED-Ed
- .edu websites (universities)
- National Geographic
- Smithsonian
- PBS LearningMedia

DO NOT:
- Invent URLs or use placeholder links
- Suggest generic "google this" advice
- Give away the answer
- Use unreliable sources (random blogs, Wikipedia for citations)

CONFIDENCE LEVELS:
- Mark "high" confidence only for verified, reputable sources
- If unsure about a URL or resource, mark "medium" or don't include it`;

    let userPrompt = '';

    if (question_id) {
      // Progressive hints for a specific question
      const question = questions.find((q: any) => q.id === question_id);
      userPrompt = `Generate Level ${current_hint_level} hints for this question.

Question: ${question.question}
Type: ${question.type}
Student Grade Level: ${student_profile.grade_level}

Already shown hints:
${existing_hints.map((h: any, i: number) => `${i + 1}. ${h.text}`).join('\n')}

Level ${current_hint_level} guidance:
${current_hint_level === 1 ? '- Broad context and general resources\n- External links to overview materials' : ''}
${current_hint_level === 2 ? '- More specific guidance\n- Narrower resource recommendations\n- Focus areas without giving away answer' : ''}
${current_hint_level === 3 ? '- Very specific hints\n- Direct pointers to relevant concepts\n- Still require student to synthesize the answer' : ''}

${reading_materials ? `Reading Material: "${reading_materials.title}"\nPage references available: ${JSON.stringify(reading_materials.page_references)}` : ''}

Return JSON format:
{
  "hints": [
    {
      "type": "context" | "resource_link" | "reading_reference" | "concept_explanation",
      "text": "Brief hint text",
      "links": [{"url": "real-url", "title": "title", "description": "desc"}],
      "page_reference": "Page X, paragraph Y" (if applicable),
      "confidence": "high" | "medium"
    }
  ],
  "additional_resources": [
    {"url": "real-url", "title": "title", "type": "video" | "article", "duration": "X minutes"}
  ]
}`;
    } else {
      // Full study guide generation
      userPrompt = `Create a study guide for this assignment with ${questions.length} questions.

Student Profile:
- Grade Level: ${student_profile.grade_level}
- Learning Style: ${student_profile.learning_style || 'Not specified'}
- Interests: ${student_profile.interests?.join(', ') || 'Not specified'}

${reading_materials ? `Reading Material: "${reading_materials.title}"\nPage references: ${JSON.stringify(reading_materials.page_references)}` : ''}

Questions:
${questions.map((q: any, i: number) => `
${i + 1}. [${q.type}] ${q.question}
${q.type === 'multiple_choice' ? `Options: ${q.options?.join(', ')}` : ''}
`).join('\n')}

For EACH question, provide:
1. Contextual hint (what concept/topic to focus on)
2. 1-2 reputable resource links (real URLs only)
3. Reading page references if provided
4. Additional resources (videos/articles)

Return JSON format:
{
  "study_guide": {
    "[question_id]": {
      "hints": [
        {
          "type": "context" | "resource_link" | "reading_reference" | "concept_explanation",
          "text": "Hint text",
          "links": [{"url": "real-url", "title": "title", "description": "desc"}],
          "page_reference": "Page X" (if applicable),
          "confidence": "high" | "medium"
        }
      ],
      "additional_resources": [
        {"url": "real-url", "title": "title", "type": "video" | "article", "duration": "X min"}
      ]
    }
  }
}`;
    }

    console.log('Calling Lovable AI for study guide generation...');

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
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const content = aiData.choices[0].message.content;
    const studyGuideData = JSON.parse(content);

    // If full study guide (not progressive hints), cache it
    if (!question_id && studyGuideData.study_guide) {
      console.log('Caching study guide...');
      await supabase
        .from('assignment_study_guides')
        .upsert({
          assignment_id,
          study_guide: studyGuideData.study_guide,
          generated_at: new Date().toISOString(),
          version: 1
        });
    }

    return new Response(
      JSON.stringify(studyGuideData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-study-guide:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
