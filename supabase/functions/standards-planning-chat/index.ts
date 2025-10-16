import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, phase } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from('standards_planning_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Build context based on phase
    let systemPrompt = `You are an expert educational consultant helping parents and educators set up standards-based homeschool curricula. You understand state standards, homeschool regulations, and compliance requirements across all US states and territories.

Your role is to:
1. Help gather requirements (state, grade level, subjects, special needs)
2. Research and identify official standards sources
3. Explain legal homeschool requirements for their state
4. Guide them through reviewing and customizing their framework
5. Be encouraging and supportive throughout the process

Current phase: ${phase}
`;

    if (phase === 'gathering_requirements') {
      systemPrompt += `
Ask questions to gather:
- State/region (critical for legal requirements)
- Grade level(s)
- Subjects they want to cover
- Any special considerations (learning differences, religious preferences, etc.)
- Whether they need documentation for state/district reporting

Be conversational and warm. One or two questions at a time.`;
    } else if (phase === 'researching') {
      systemPrompt += `
Based on their requirements: ${JSON.stringify(session.requirements)}

Help them understand:
- Where official standards can be found
- What the standards mean in practice
- Legal requirements for their state
- What documentation they'll need

Provide specific, actionable information.`;
    } else if (phase === 'reviewing') {
      systemPrompt += `
Help them review the compiled standards and legal requirements.
Answer questions about specific standards, suggest modifications, explain compliance needs.

Compiled data available: ${JSON.stringify(session.compiled_standards).substring(0, 500)}...`;
    }

    // Prepare conversation history
    const conversationHistory = session.conversation_history || [];
    
    // Call OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message.content;

    // Update conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage }
    ];

    // Extract requirements if in gathering phase
    let updatedRequirements = session.requirements || {};
    if (phase === 'gathering_requirements') {
      // Simple extraction - could be enhanced with structured output
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('grade') || lowerMessage.match(/\d+th/)) {
        const gradeMatch = message.match(/(\d+)(?:th|st|nd|rd)?(?:\s+grade)?/i);
        if (gradeMatch) updatedRequirements.grade = gradeMatch[1];
      }
      if (lowerMessage.includes('state') || lowerMessage.match(/(?:oklahoma|california|texas|florida|new york)/i)) {
        const stateMatch = message.match(/(?:in\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
        if (stateMatch) updatedRequirements.state = stateMatch[1];
      }
    }

    // Update session
    const { error: updateError } = await supabase
      .from('standards_planning_sessions')
      .update({
        conversation_history: updatedHistory,
        requirements: updatedRequirements,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        requirements: updatedRequirements,
        conversationHistory: updatedHistory
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});