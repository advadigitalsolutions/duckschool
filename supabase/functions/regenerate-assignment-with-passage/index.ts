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
    const { assignmentId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching assignment:', assignmentId);

    // Get the assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select(`
        *,
        curriculum_items (
          id,
          title,
          body,
          course_id
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError) throw assignmentError;

    const body = assignment.curriculum_items.body;
    
    // Add the passage that was referenced in the questions
    const passage = `**A Corner Store at Dusk**

Paragraph 1:
Jose leaned against the brick, counting change the way some people count breaths. The corner store's neon hummed above him, bruised purple and flickering. He watched the cars pass like hands in a game he never learned the rules for; each headlight was a promise that didn't belong to him.

Paragraph 2:
Across the way, laughter shaped like leather jackets and easy spending drifted from the diner. The distance between them wasn't measured in steps.

Paragraph 3:
A girl on a bike skidded to the curb, offering a crooked smile. "You need a dollar for the bus?" She pulled out a crumpled bill without waiting for an answer.

Paragraph 4:
He shoved the coins back into his pocket and walked away, the neon receding like a memory the city couldn't keep.`;

    // Update the body with reading materials and improved structure
    const updatedBody = {
      ...body,
      reading_materials: passage,
      description: "This assignment asks you to compare a contemporary passage about social exclusion with S.E. Hinton's The Outsiders. You'll analyze themes, use textual evidence, and write a creative comparative essay.",
      overview_sections: [
        {
          title: "What You'll Do",
          points: [
            "Read the short contemporary scene below and compare it to The Outsiders",
            "Plan and write a comparative creative essay (700-1,000 words)",
            "Use textual evidence from both texts with proper citations",
            "Complete guided practice tasks and answer auto-graded questions"
          ]
        },
        {
          title: "Requirements",
          points: [
            "Essay length: 700-1,000 words",
            "Include at least three quotations or paraphrases with citations",
            "Use at least three academic or domain-specific vocabulary words",
            "Turn in: (a) annotated notes, (b) final essay, (c) reflection (100-150 words)"
          ]
        },
        {
          title: "Grading",
          points: [
            "Your essay will be graded using the rubric provided",
            "You may attempt the auto-graded questions up to 3 times to improve your score"
          ]
        }
      ]
    };

    // Update the curriculum item
    const { error: updateError } = await supabase
      .from('curriculum_items')
      .update({ body: updatedBody })
      .eq('id', assignment.curriculum_items.id);

    if (updateError) throw updateError;

    console.log('Assignment regenerated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Assignment regenerated with passage and improved formatting'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error regenerating assignment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
