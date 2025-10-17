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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const lessonId = '167dc691-b374-449b-bf68-cabe491d5e7e';

    // Get current lesson
    const { data: currentLesson, error: fetchError } = await supabaseClient
      .from('curriculum_items')
      .select('body')
      .eq('id', lessonId)
      .single();

    if (fetchError) throw fetchError;

    // Prepare the new content to add
    const newContent = {
      reading_materials: [
        {
          title: "Example 1: Sci-Fi Escape",
          content: "The airlock hissed, spitting frost. Captain Zara yanked the lever halfway—red warning lights flared across her visor. Behind her, the ship groaned, hull buckling. She had maybe thirty seconds.\n\n**Choice A:** Override the safety lock and blow the hatch now.\n**Consequence A:** You tumble into the void but escape the explosion.\n\n**Choice B:** Manually crank the airlock wheel to preserve the seal.\n**Consequence B:** It takes longer, but you avoid depressurizing the entire ship.\n\n*Word count: 71 words*",
          type: "example"
        },
        {
          title: "Example 2: Fantasy Quest",
          content: "The bridge swayed, rope fraying with each gust. Kael clutched the wooden rail, knuckles white. Below, the canyon dropped into shadow. The village burned on the far side—screams echoing faint but real.\n\n**Choice A:** Sprint across the shaking bridge before it snaps.\n**Consequence A:** You reach the other side but the bridge collapses behind you—no retreat.\n\n**Choice B:** Turn back and find the long tunnel route.\n**Consequence B:** Safer path, but you arrive an hour later.\n\n*Word count: 78 words*",
          type: "example"
        },
        {
          title: "Example 3: Contemporary Mystery",
          content: "Rain hammered the phone booth glass. Maya stared at the crumpled note—a single address, no name. Her thumb hovered over the keypad. Behind her, headlights swept the empty lot.\n\n**Choice A:** Call the number on the note right now.\n**Consequence A:** A voice answers, but you don't recognize it.\n\n**Choice B:** Pocket the note and walk to the address yourself.\n**Consequence B:** You keep control but lose the element of surprise.\n\n*Word count: 73 words*",
          type: "example"
        }
      ],
      self_editing_checklist: {
        title: "Self-Editing Checklist for Your Scene",
        instructions: "Apply at least TWO of these strategies to your draft:",
        steps: [
          {
            number: 1,
            task: "Cut one adverb",
            example: "Change 'walked slowly' → 'crept' or 'trudged'"
          },
          {
            number: 2,
            task: "Replace one weak verb with a stronger verb",
            example: "Change 'went quickly' → 'dashed' or 'sprinted'"
          },
          {
            number: 3,
            task: "Add or strengthen one sensory detail",
            example: "Change 'dark room' → 'room smelling of wet concrete'"
          },
          {
            number: 4,
            task: "Remove one redundant phrase",
            example: "Delete 'He thought to himself' (thinking is always 'to himself')"
          },
          {
            number: 5,
            task: "Tighten one line of dialogue or narration",
            example: "Change 'She said that she was worried' → 'She bit her lip'"
          }
        ],
        success_note: "Check off at least 2 items above before submitting!"
      },
      submission_instructions: {
        method: "text_submission",
        format_requirements: {
          word_count: "100-200 words",
          format: "Plain text or word processor document",
          must_include: [
            "Character name or clear protagonist",
            "2-3 sentence opening with goal and obstacle",
            "One decision point labeled Choice A and Choice B",
            "One-sentence consequence for each choice"
          ]
        },
        before_you_submit: [
          "✓ Word count is between 100-200 words",
          "✓ Decision point has clear A and B labels",
          "✓ Applied at least 2 editing strategies from the checklist",
          "✓ Scene is family-friendly with no mature content",
          "✓ Included at least one sensory detail"
        ],
        submission_note: "You can submit your scene as typed text in the submission box below. Copy and paste from your text editor or type directly."
      },
      progress_tracker: {
        title: "Your Progress",
        steps: [
          { number: 1, label: "Read Examples & Bridge Support", emoji: "📖" },
          { number: 2, label: "Guided Practice (Opening)", emoji: "✍️" },
          { number: 3, label: "Draft Full Scene", emoji: "🎬" },
          { number: 4, label: "Self-Edit with Checklist", emoji: "✂️" },
          { number: 5, label: "Submit & Answer Questions", emoji: "🎯" }
        ],
        note: "Check off each step as you complete it!"
      },
      research_links: [
        {
          title: "Khan Academy: Show, Don't Tell in Writing",
          url: "https://www.khanacademy.org/humanities/grammar/style-and-the-writer",
          type: "article",
          description: "Learn the fundamentals of showing vs. telling with examples"
        },
        {
          title: "Writing Micro-Fiction: Quick Tips (YouTube)",
          url: "https://www.youtube.com/results?search_query=micro+fiction+writing+tips+for+students",
          type: "video",
          description: "Search results for student-friendly micro-fiction tutorials"
        },
        {
          title: "Interactive Fiction Design Basics",
          url: "https://www.commonsense.org/education/articles/what-is-interactive-fiction",
          type: "article",
          description: "Understanding branching choices in text-based games"
        }
      ],
      sample_student_response: {
        title: "Example Student Scene (Good Model)",
        content: "The basement door groaned. Aki held her breath, phone flashlight trembling. Cobwebs stuck to her face—thick, sticky. Behind her, footsteps creaked on the stairs. She had to choose now.\n\n**Choice A:** Hide behind the water heater and stay silent.\n**Consequence A:** You avoid detection but remain trapped down here.\n\n**Choice B:** Shout for help and hope someone hears you.\n**Consequence B:** The footsteps stop, but now they know exactly where you are.\n\n*Total: 78 words*",
        annotations: [
          "✓ Clear protagonist (Aki) with immediate goal (escape/hide)",
          "✓ Sensory details: groaning door, trembling flashlight, sticky cobwebs",
          "✓ Immediate stakes: footsteps approaching, must choose NOW",
          "✓ Two distinct choices with different risks",
          "✓ Concise consequences (one sentence each)",
          "✓ Strong verbs: groaned, trembling, creaked, stuck"
        ],
        why_it_works: "This scene establishes character, setting, and danger in under 80 words. The sensory details (cobwebs, trembling light) show fear without saying 'Aki was scared.' Both choices have clear trade-offs that a player can weigh quickly."
      }
    };

    // Merge with existing body
    const updatedBody = {
      ...currentLesson.body,
      ...newContent,
      // Enhanced bridge_support with complete examples
      bridge_support: {
        ...currentLesson.body.bridge_support,
        complete_examples: [
          {
            type: "concision",
            long: "He cautiously and slowly opened the heavy door because he was afraid of what might be behind it.",
            short: "He eased the heavy door open, breath held.",
            explanation: "The short version cuts 'cautiously and slowly' (redundant adverbs), replaces the 'because' explanation with showing (breath held), and uses stronger verb 'eased'."
          },
          {
            type: "transformation_exercise",
            original: "She quickly ran away from the loud, scary noise that was coming from behind the wall.",
            improved: "She bolted from the wall's grinding shriek.",
            changes_made: [
              "Replaced 'quickly ran' with stronger verb 'bolted'",
              "Changed 'loud, scary noise' to specific 'grinding shriek'",
              "Cut redundant 'that was coming from'",
              "Result: 17 words → 8 words"
            ]
          }
        ],
        branching_visual: {
          example: "Decision Tree Example",
          calculation: "1 decision × 2 options = 2 branches | 2 decisions × 2 options each = 4 branches (2²)",
          visual_note: "Draw a simple Y-shape on paper: one starting point splits into two paths (A and B)"
        }
      }
    };

    // Update the curriculum item
    const { data: updated, error: updateError } = await supabaseClient
      .from('curriculum_items')
      .update({ body: updatedBody })
      .eq('id', lessonId)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log('Successfully updated lesson with complete content');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lesson updated with all missing content',
        added_components: [
          'reading_materials (3 example micro-fiction scenes)',
          'self_editing_checklist (5 concrete strategies)',
          'submission_instructions (clear requirements)',
          'progress_tracker (5-step visual guide)',
          'research_links (3 pre-selected URLs)',
          'sample_student_response (annotated good example)',
          'enhanced_bridge_support (complete transformation examples)'
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating lesson:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
