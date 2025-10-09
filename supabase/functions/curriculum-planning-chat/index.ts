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
        content: "Hi! I'll help you create a personalized curriculum plan for your student. This will include an initial assessment to gauge their level, then an adaptive curriculum that adjusts to their progress.\n\nWhat's your student's name, grade level, and where are you located?"
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
    console.log('Extracted data from message:', { message, stage, updatedData });

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
  if (!data.studentName || !data.gradeLevel) return 'initial';
  if (!data.location || !data.standardsFramework) return 'framework';
  if (!data.subjects || !data.goals) return 'goals';
  return 'ready';
}

function buildSystemPrompt(stage: string, data: any): string {
  const basePrompt = `You are an expert educational consultant helping parents create personalized homeschool curriculum plans.

CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:
1. Keep ALL responses to 2-3 sentences MAXIMUM
2. Ask ONLY ONE question per response
3. Move through stages QUICKLY - don't dig for unnecessary details
4. Accept brief answers and move forward
5. NEVER ask follow-up questions if you have enough to proceed
6. REMEMBER EVERYTHING the parent mentions - extracurriculars, interests, learning challenges, accommodations, goals

KEY MESSAGING:
- We'll create an INITIAL ASSESSMENT to understand the student's current level
- The curriculum ADAPTS IN REAL-TIME based on their progress
- Everything is PERSONALIZED to their timeline and goals

CRITICAL: If parent mentions ANY extracurriculars, interests, or additional subjects they want (like music, art, sports, coding projects, languages, etc.), YOU MUST CAPTURE THEM. They will be added as courses.

Current stage: ${stage}
Data collected: ${JSON.stringify(data, null, 2)}

`;

  const stagePrompts: Record<string, string> = {
    'initial': 'Get: student name, grade level, and location in ONE question. Example: "What\'s your student\'s name, grade level, and where are you located?" Keep it friendly but brief.',
    'framework': `Based on their location (${data.location || 'provided'}), quickly suggest appropriate standards. Example: "I recommend Common Core for ${data.location || 'your area'}. Does that work?" Just 1-2 sentences.`,
    'goals': `Ask: "What subjects and any extracurriculars (like music, art, coding, sports) should we focus on?" Then ask goal. Keep brief.`,
    'ready': `Confirm: "Perfect! Creating courses for ${data.subjects || 'core subjects'}${data.extracurriculars && data.extracurriculars.length > 0 ? ' plus ' + data.extracurriculars.join(' and ') : ''} with initial assessments to gauge ${data.studentName || 'your student'}\'s level and build adaptive curriculum toward ${data.goals || 'their goals'}. Ready?" STOP.`
  };

  return basePrompt + (stagePrompts[stage] || stagePrompts['initial']);
}

function extractDataFromMessage(message: string, existingData: any, stage: string): any {
  const data = { ...existingData };
  const lowerMessage = message.toLowerCase();

  // Extract grade level
  if (!data.gradeLevel) {
    const gradeMatch = message.match(/\b(\d+)(th|st|nd|rd)?\s*grade\b/i) || 
                       message.match(/\bgrade\s*(\d+)/i) ||
                       message.match(/\b(kindergarten|k)\b/i);
    if (gradeMatch) {
      data.gradeLevel = gradeMatch[1] === 'kindergarten' || gradeMatch[1] === 'k' ? 'Kindergarten' : `Grade ${gradeMatch[1]}`;
    }
  }
  
  // Extract name (first capitalized word that's not a location)
  if (!data.studentName) {
    const nameMatch = message.match(/\b([A-Z][a-z]+)\b/);
    if (nameMatch && !['California', 'Texas', 'Florida', 'New', 'Common', 'Core'].includes(nameMatch[1])) {
      data.studentName = nameMatch[1];
    }
  }

  // Extract location
  if (!data.location) {
    const locations = ['california', 'texas', 'florida', 'new york', 'illinois', 'pennsylvania', 'ohio'];
    const found = locations.find(loc => lowerMessage.includes(loc));
    if (found) {
      data.location = found.charAt(0).toUpperCase() + found.slice(1);
    }
  }

  // Extract standards framework
  if (!data.standardsFramework && (lowerMessage.includes('yes') || lowerMessage.includes('common core') || lowerMessage.includes('sounds good'))) {
    data.standardsFramework = 'Common Core';
  }

  // Extract subjects and goals - be generous with any subject/goal keywords
  if (stage === 'goals') {
    if (!data.subjects) {
      const subjects = ['math', 'reading', 'science', 'history', 'english', 'language arts', 'social studies'];
      const mentioned = subjects.filter(s => lowerMessage.includes(s));
      if (mentioned.length > 0) {
        data.subjects = mentioned.join(', ');
      } else if (message.length > 10) {
        data.subjects = 'core subjects'; // Default if they mentioned anything
      }
    }
    
    if (!data.goals) {
      const goals = ['college', 'grade level', 'mastery', 'enrichment', 'catch up', 'advanced', 'prep'];
      const mentioned = goals.find(g => lowerMessage.includes(g));
      if (mentioned) {
        data.goals = mentioned;
      } else if (message.length > 15) {
        data.goals = 'grade-level mastery'; // Reasonable default
      }
    }
  }

  // Extract extracurriculars - look for common activities and interests
  const extracurricularKeywords = [
    'music', 'piano', 'guitar', 'violin', 'drums', 'band', 'orchestra', 'choir',
    'art', 'drawing', 'painting', 'sculpture', 'photography', 'digital art',
    'sports', 'soccer', 'basketball', 'tennis', 'swimming', 'dance', 'martial arts',
    'coding', 'programming', 'robotics', 'game development', 'web design',
    'theater', 'drama', 'acting', 'speech', 'debate',
    'language', 'spanish', 'french', 'mandarin', 'japanese', 'german',
    'cooking', 'baking', 'culinary',
    'creative writing', 'journalism', 'poetry',
    'chess', 'strategy games'
  ];

  const foundExtracurriculars = extracurricularKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  );

  if (foundExtracurriculars.length > 0) {
    data.extracurriculars = data.extracurriculars || [];
    // Add new ones that aren't already in the list
    foundExtracurriculars.forEach(extra => {
      if (!data.extracurriculars.some((e: string) => e.toLowerCase().includes(extra))) {
        data.extracurriculars.push(extra);
      }
    });
  }

  // Also capture accommodations and learning needs
  const accommodationKeywords = ['adhd', 'dyslexia', 'autism', 'anxiety', 'fatigue', 'visual', 'auditory'];
  const foundAccommodations = accommodationKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  
  if (foundAccommodations.length > 0) {
    data.accommodations = data.accommodations || [];
    foundAccommodations.forEach(acc => {
      if (!data.accommodations.includes(acc)) {
        data.accommodations.push(acc);
      }
    });
  }

  return data;
}

function isReadyToFinalize(data: any): boolean {
  // Only need the essentials - be generous
  return !!(
    data.studentName &&
    data.gradeLevel &&
    data.location &&
    data.standardsFramework &&
    data.subjects &&
    data.goals
  );
}