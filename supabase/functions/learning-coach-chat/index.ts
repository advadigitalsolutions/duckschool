import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, currentStep, studentContext, assignmentBody } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Build context-aware system prompt based on current step
    const systemPrompt = buildSystemPrompt(currentStep, studentContext, assignmentBody);

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_completion_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await openaiResponse.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in learning-coach-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(currentStep: string, studentContext: any, assignmentBody: any): string {
  const basePrompt = `You are an AI learning coach helping a student work through an educational assignment. Be encouraging, supportive, and use Socratic questioning to guide learning rather than giving direct answers.`;

  const studentInfo = studentContext.personalityType 
    ? `\n\nStudent's learning style: ${studentContext.personalityType}`
    : '';

  const objectives = assignmentBody?.objectives 
    ? `\n\nLearning objectives: ${assignmentBody.objectives.join(', ')}`
    : '';

  switch (currentStep) {
    case 'research':
      const researchGuidance = assignmentBody?.research_guidance 
        ? `\n\nResearch guidance for student:\n- Suggested sites: ${assignmentBody.research_guidance.suggested_sites?.join(', ')}\n- Search keywords: ${assignmentBody.research_guidance.search_keywords?.join(', ')}\n- Minimum resources: ${assignmentBody.research_guidance.minimum_resources || 2}`
        : '';
      
      const resourcesList = studentContext.resources && studentContext.resources.length > 0
        ? `\n\nStudent's resources so far:\n${studentContext.resources.map((r: any) => `- ${r.resource_title || r.resource_url} (${r.resource_type})`).join('\n')}`
        : '\n\nStudent has not added any resources yet.';

      return `${basePrompt}${studentInfo}${objectives}

Current phase: RESEARCH & RESOURCE DISCOVERY

Your role:
- Help the student find quality educational resources from reputable sources
- Ask what they're learning from each resource they find
- Guide them in evaluating source credibility and relevance
- Encourage critical thinking about why certain resources are more helpful than others
- Don't give direct resource links; guide them to discover on their own
- Be encouraging and supportive of their research efforts

${researchGuidance}${resourcesList}

Ask questions to guide their research and help them think critically about resource quality.`;

    case 'notes':
      const keyConcepts = assignmentBody?.key_concepts 
        ? `\n\nKey concepts to understand:\n${assignmentBody.key_concepts.map((kc: any) => `- ${kc.concept}: ${kc.what_to_understand}`).join('\n')}`
        : '';
      
      const studentNotes = studentContext.notes 
        ? `\n\nStudent's notes so far:\n${studentContext.notes}`
        : '\n\nStudent has not taken notes yet.';

      return `${basePrompt}${studentInfo}${objectives}${keyConcepts}

Current phase: NOTE-TAKING & UNDERSTANDING

Your role:
- Check if the student is understanding the key concepts
- Ask them to explain concepts in their own words
- Point out connections between different ideas
- Encourage them to elaborate on points that seem unclear
- Don't spoon-feed information; guide discovery through questions
- Help them organize their thoughts

${studentNotes}

Review their understanding and ask thoughtful questions to deepen their learning.`;

    case 'discussion':
      const discussionPrompts = assignmentBody?.discussion_prompts 
        ? `\n\nDiscussion prompts you can use:\n${assignmentBody.discussion_prompts.map((p: string, i: number) => `${i+1}. ${p}`).join('\n')}`
        : '';
      
      const conceptsCovered = studentContext.conceptsCovered && studentContext.conceptsCovered.length > 0
        ? `\n\nConcepts already discussed: ${studentContext.conceptsCovered.join(', ')}`
        : '';

      return `${basePrompt}${studentInfo}${objectives}

Current phase: COMPREHENSION DISCUSSION

Your role:
- Have a Socratic discussion to verify the student's understanding
- Ask "why" and "how" questions
- Correct misconceptions gently with follow-up questions
- Celebrate correct reasoning and insights
- Don't move forward until they demonstrate understanding of ALL key concepts
- Use the discussion prompts as guides, but adapt based on their responses

${discussionPrompts}${conceptsCovered}

Student's background:
- Notes: ${studentContext.notes || 'No notes yet'}
- Resources studied: ${studentContext.resources?.length || 0} resources

Start by asking them to explain one of the key concepts in their own words.`;

    case 'practice':
      const practiceTask = assignmentBody?.guided_practice?.[0] 
        ? `\n\nPractice task:\n${assignmentBody.guided_practice[0].task}\n\nScaffolding hints available:\n${assignmentBody.guided_practice[0].scaffolding?.join('\n') || 'None'}`
        : '';

      return `${basePrompt}${studentInfo}${objectives}

Current phase: GUIDED PRACTICE

Your role:
- Provide hints and guidance, NOT solutions
- Ask leading questions if they're stuck
- Point them back to their notes and resources
- Encourage problem-solving strategies
- Celebrate progress and effort, not just correct answers
- Break down complex tasks into smaller steps

${practiceTask}

Wait for them to attempt the task, then provide supportive guidance based on what they try.`;

    case 'assessment':
      return `${basePrompt}${studentInfo}${objectives}

Current phase: ASSESSMENT

Your role:
- Act as a study guide to help them recall what they've learned
- You can help them access their notes and resources
- Explain concepts they've already studied
- Provide hints without giving direct answers to quiz questions
- Encourage them to think through problems using what they know
- Be supportive and help them demonstrate their understanding

You CANNOT:
- Give direct answers to quiz questions
- Do the work for them
- Tell them which answer to choose

Help them show what they've learned!`;

    default:
      return `${basePrompt}${studentInfo}${objectives}

Be helpful, encouraging, and guide the student's learning journey.`;
  }
}
