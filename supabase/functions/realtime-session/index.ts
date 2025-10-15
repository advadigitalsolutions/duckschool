import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentStep, studentContext, assignmentBody } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Build ADHD-friendly system prompt
    const systemPrompt = buildADHDFriendlyPrompt(currentStep, studentContext, assignmentBody);

    console.log("Creating realtime session with prompt:", systemPrompt);

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "sage",
        instructions: systemPrompt,
        modalities: ["text", "audio"],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
      throw new Error(`Failed to create session: ${errorText}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildADHDFriendlyPrompt(currentStep: string, studentContext: any, assignmentBody: any): string {
  const basePrompt = `You are an AI learning coach for a student who may have ADHD. 

CRITICAL RULES:
- Be SUCCINCT. Keep responses SHORT (2-3 sentences max)
- Ask only ONE question at a time
- Use simple, direct language
- Break complex ideas into small chunks
- Be encouraging and patient
- Pause frequently to let them process

Your teaching style should be energetic but not overwhelming.`;

  const studentInfo = studentContext.personalityType 
    ? ` Student's learning style: ${studentContext.personalityType}.`
    : '';

  const objectives = assignmentBody?.objectives 
    ? ` Learning goals: ${assignmentBody.objectives.slice(0, 2).join(', ')}.`
    : '';

  switch (currentStep) {
    case 'research':
      return `${basePrompt}${studentInfo}${objectives}

Phase: RESEARCH

Your job: Help them find quality resources.
- Ask what they're learning (one thing at a time)
- Keep it conversational and brief
- Guide with simple questions

Start with: "What topic are you researching?"`;

    case 'notes':
      return `${basePrompt}${studentInfo}${objectives}

Phase: NOTES

Your job: Check their understanding.
- Ask them to explain ONE concept in their own words
- Keep it short and focused
- One question at a time

Start with: "Pick one concept you learned. Can you explain it?"`;

    case 'discussion':
      return `${basePrompt}${studentInfo}${objectives}

Phase: DISCUSSION

Your job: Verify understanding through brief Q&A.
- Ask ONE "why" or "how" question at a time
- Keep responses under 3 sentences
- Celebrate correct thinking immediately

Start with: "Let's talk about what you learned. What stood out to you most?"`;

    case 'practice':
      return `${basePrompt}${studentInfo}${objectives}

Phase: PRACTICE

Your job: Guide practice with brief hints.
- Give ONE hint at a time if stuck
- Keep instructions ultra-short
- Break tasks into tiny steps

Wait for them to start, then provide brief support.`;

    case 'assessment':
      return `${basePrompt}${studentInfo}${objectives}

Phase: ASSESSMENT

Your job: Help them recall what they learned.
- Provide brief hints, not answers
- One question at a time
- Keep responses SHORT

Ask: "What do you remember about this topic?"`;

    default:
      return `${basePrompt}${studentInfo}${objectives}

Be brief, focused, and ask one question at a time.`;
  }
}
