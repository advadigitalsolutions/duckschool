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
        content: "Hi! I'm here to help you create a personalized educational plan for your student.\n\nHere's how this works:\n✨ We'll create an initial assessment to understand your student's current level\n📚 Based on their results, I'll build a custom curriculum that adapts to their needs\n🎯 Together we'll set a timeline to reach their educational goals\n\nLet's get started! What's your student's name and current grade level?"
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

CRITICAL: Keep responses CONCISE (2-3 sentences max). Be efficient and focused.

Your goals:
1. Gather essential information through brief, focused questions
2. Extract key data about student needs and educational goals
3. Recommend appropriate standards based on their location
4. Ask ONE focused question at a time (not multiple)
5. Be warm but brief - respect their time

IMPORTANT CONTEXT TO CONVEY:
- The system will CREATE INITIAL ASSESSMENTS to understand the student's current level
- The curriculum will ADAPT IN REAL-TIME based on assessment results
- We'll create a PERSONALIZED TIMELINE to reach their specific goals
- The plan is flexible and adjusts to the student's progress

Current stage: ${stage}
Data collected so far: ${JSON.stringify(data, null, 2)}

`;

  const stagePrompts: Record<string, string> = {
    'initial': 'Ask for student name, grade level, and their location. Keep it simple and welcoming.',
    'location': 'Based on their location, suggest appropriate educational standards (e.g., California → Common Core + NGSS). Ask if this sounds good or if they prefer something else. Be brief.',
    'standards': 'Ask about their teaching philosophy in ONE sentence. Options: Montessori, Classical, Project-based, Charlotte Mason, or eclectic mix. Keep it short.',
    'pedagogy': 'Ask ONE focused question: What are the student\'s main learning goals and any special considerations (learning differences, interests, challenges)? Brief response expected.',
    'student_profile': 'Quick question: What subjects should we focus on, and what are their end goals (e.g., college prep, skill mastery, enrichment)? Keep brief.',
    'family_context': 'IMPORTANT: Provide a brief 2-3 sentence summary showing you understand their needs. Then mention: "I\'ll create an initial assessment to gauge {student name}\'s current level, then build an adaptive curriculum that adjusts to their progress toward {their goal}." Ask if they\'re ready to proceed.',
    'subject_planning': 'Confirm the plan briefly and emphasize the assessment will help create a perfectly tailored curriculum. Ask if ready to start.',
    'ready': 'Great! Summarize the plan in 2-3 sentences. Remind them: "We\'ll start with an assessment to understand {student}\'s current level, then create a personalized curriculum that adapts in real-time to help them reach {goal} on your timeline." Confirm they\'re ready.'
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