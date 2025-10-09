import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, action } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Handle different actions
    if (action === 'start') {
      // Create new planning session
      const { data: session, error: sessionError } = await supabase
        .from('curriculum_planning_sessions')
        .insert({
          parent_id: user.id,
          status: 'in_progress',
          conversation_history: [],
          collected_data: {}
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const initialMessage = {
        role: 'assistant',
        content: "Hi! I'm here to help create the perfect educational plan for your student. Let's start with some basics. What's your student's name and current grade level?"
      };

      return new Response(JSON.stringify({
        sessionId: session.id,
        message: initialMessage,
        stage: 'initial'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get existing session
    const { data: session, error: sessionError } = await supabase
      .from('curriculum_planning_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('parent_id', user.id)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    // Append user message to history
    const conversationHistory = [
      ...(session.conversation_history || []),
      { role: 'user', content: message, timestamp: new Date().toISOString() }
    ];

    // Determine conversation stage and build context
    const collectedData = session.collected_data || {};
    const stage = determineStage(collectedData);

    // Build AI prompt
    const systemPrompt = buildSystemPrompt(stage, collectedData);
    
    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-10) // Last 10 messages for context
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message.content;

    // Extract structured data from conversation
    const updatedData = extractDataFromMessage(message, collectedData, stage);

    // Update conversation history
    conversationHistory.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date().toISOString()
    });

    // Update session
    const { error: updateError } = await supabase
      .from('curriculum_planning_sessions')
      .update({
        conversation_history: conversationHistory,
        collected_data: updatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      message: {
        role: 'assistant',
        content: assistantMessage
      },
      stage,
      collectedData: updatedData,
      canFinalize: isReadyToFinalize(updatedData)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in curriculum-planning-chat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function determineStage(data: any): string {
  if (!data.studentName) return 'initial';
  if (!data.location) return 'location';
  if (!data.standardsFramework) return 'standards';
  if (!data.pedagogicalApproach) return 'pedagogy';
  if (!data.learningProfile) return 'student_profile';
  if (!data.familyContext) return 'family_context';
  if (!data.subjectPlanning) return 'subject_planning';
  return 'ready';
}

function buildSystemPrompt(stage: string, data: any): string {
  const basePrompt = `You are an expert educational consultant helping parents create personalized homeschool curriculum plans.

Your goals:
1. Gather information through natural, warm conversation
2. Extract structured data about student needs, learning style, and constraints
3. Recommend appropriate educational standards and frameworks
4. Ask 1-2 focused questions at a time
5. Be encouraging and supportive

Current stage: ${stage}
Data collected so far: ${JSON.stringify(data, null, 2)}

`;

  const stagePrompts: Record<string, string> = {
    'initial': 'Ask for student name, age/grade level, and location (country/state). Be warm and welcoming.',
    'location': 'Now that you know their location, discuss what educational standards they want to follow. Suggest options based on their region (e.g., California → Common Core + NGSS).',
    'standards': 'Discuss pedagogical approaches. Ask what teaching philosophy resonates with them (Montessori, Classical, Project-based, etc.)',
    'pedagogy': 'Deep dive into student profile: learning style, interests, strengths, challenges, special needs (IEP/504, giftedness, neurodivergence)',
    'student_profile': 'Ask about family context: time availability, parent involvement level, resources available, educational goals',
    'family_context': 'Discuss subject planning. For each core subject, understand current level and goals',
    'subject_planning': 'Summarize the plan and ask if they want to proceed with course creation',
    'ready': 'Confirm readiness to create curriculum'
  };

  return basePrompt + (stagePrompts[stage] || stagePrompts['initial']);
}

function extractDataFromMessage(message: string, existingData: any, stage: string): any {
  const data = { ...existingData };
  const lowerMessage = message.toLowerCase();

  // Simple extraction (in production, use more sophisticated NLP)
  if (stage === 'initial') {
    // Extract name and grade patterns
    const gradeMatch = message.match(/\b(\d+)(th|st|nd|rd)?\s*grade\b/i) || 
                       message.match(/\bgrade\s*(\d+)/i);
    if (gradeMatch) {
      data.gradeLevel = gradeMatch[1] + 'th grade';
    }
    
    // Simple name extraction (first capitalized word)
    const nameMatch = message.match(/\b([A-Z][a-z]+)\b/);
    if (nameMatch && !data.studentName) {
      data.studentName = nameMatch[1];
    }
  }

  if (stage === 'location') {
    if (lowerMessage.includes('california') || lowerMessage.includes('ca')) {
      data.location = 'California, USA';
      data.region = 'california';
    }
    // Add more location patterns...
  }

  if (stage === 'standards' && !data.standardsFramework) {
    if (lowerMessage.includes('common core') || lowerMessage.includes('ccss')) {
      data.standardsFramework = ['CCSS'];
    }
    if (lowerMessage.includes('ngss') || lowerMessage.includes('science')) {
      data.standardsFramework = [...(data.standardsFramework || []), 'NGSS'];
    }
  }

  if (stage === 'pedagogy' && !data.pedagogicalApproach) {
    const approaches = ['montessori', 'waldorf', 'classical', 'charlotte mason', 'unschool', 'project-based'];
    const found = approaches.find(a => lowerMessage.includes(a));
    if (found) {
      data.pedagogicalApproach = found;
    }
  }

  return data;
}

function isReadyToFinalize(data: any): boolean {
  return !!(
    data.studentName &&
    data.gradeLevel &&
    data.location &&
    data.standardsFramework &&
    data.pedagogicalApproach
  );
}