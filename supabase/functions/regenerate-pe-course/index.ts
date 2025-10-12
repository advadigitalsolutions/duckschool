import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError) throw courseError;

    // Delete old curriculum items and assignments for this course
    const { data: oldItems } = await supabase
      .from('curriculum_items')
      .select('id')
      .eq('course_id', courseId);

    if (oldItems && oldItems.length > 0) {
      const itemIds = oldItems.map(item => item.id);
      
      // Delete assignments first (foreign key constraint)
      await supabase
        .from('assignments')
        .delete()
        .in('curriculum_item_id', itemIds);

      // Delete curriculum items
      await supabase
        .from('curriculum_items')
        .delete()
        .eq('course_id', courseId);
    }

    // Create new PE curriculum with mix of activities and education
    const newCurriculum = [
      // Week 1
      {
        title: "Workout Session #1",
        type: "activity",
        day: 0, // Monday
        body: {
          description: "Complete a 30+ minute workout of your choice. This could be at a gym, at home, rock climbing, or any physical activity that gets you moving!",
          goals: {
            min_duration: 30,
            intensity: "moderate or higher",
            focus: "Getting comfortable with regular exercise"
          }
        },
        est_minutes: 30
      },
      {
        title: "Understanding Protein Basics",
        type: "assignment",
        day: 1, // Tuesday
        body: {
          instructions: "Read about protein's role in fitness and recovery, then answer a few questions.",
          reading_materials: `# Protein: The Building Block of Fitness

Protein is essential for building and repairing muscle tissue after workouts. When you exercise, especially with strength training, you create tiny tears in your muscle fibers. Protein helps repair these tears, making your muscles stronger.

## How Much Protein Do You Need?

For someone starting fitness:
- **Moderate activity**: 0.8-1.0 grams per pound of body weight
- **Active training**: 1.0-1.2 grams per pound of body weight

## Good Protein Sources:
- **Animal-based**: Chicken, fish, eggs, Greek yogurt, lean beef
- **Plant-based**: Beans, lentils, tofu, quinoa, nuts

## Timing Matters:
Try to eat protein within 30-60 minutes after working out for optimal recovery.`,
          questions: [
            {
              id: "q1",
              type: "multiple_choice",
              question: "What is protein's main role in fitness?",
              options: [
                "Providing quick energy",
                "Building and repairing muscle tissue",
                "Improving flexibility",
                "Increasing heart rate"
              ],
              correct_answer: "Building and repairing muscle tissue",
              points: 10,
              explanation: "Protein repairs the micro-tears in muscle fibers created during exercise, helping muscles grow stronger."
            },
            {
              id: "q2",
              type: "multiple_choice",
              question: "When is the best time to eat protein after working out?",
              options: [
                "Within 30-60 minutes",
                "Exactly 2 hours later",
                "Right before bed",
                "It doesn't matter when"
              ],
              correct_answer: "Within 30-60 minutes",
              points: 10,
              explanation: "The post-workout window (30-60 minutes) is when your muscles are most receptive to protein for recovery."
            }
          ],
          estimated_minutes: 20
        },
        est_minutes: 20
      },
      {
        title: "Strength Training Focus",
        type: "activity",
        day: 2, // Wednesday
        body: {
          description: "Today's focus is strength training. This could be:\n• Bodyweight exercises (push-ups, squats, planks)\n• Weight lifting at the gym\n• Resistance bands at home\n• Rock climbing (great for upper body strength!)",
          goals: {
            min_duration: 30,
            intensity: "moderate to vigorous",
            focus: "Building strength"
          }
        },
        est_minutes: 30
      },
      {
        title: "Sleep Hygiene for Athletes",
        type: "assignment",
        day: 3, // Thursday
        body: {
          instructions: "Learn why sleep is crucial for fitness progress and how to improve it.",
          reading_materials: `# Sleep: The Secret Weapon

Sleep is when your body does most of its muscle repair and growth. Without adequate sleep, your workouts won't be as effective!

## Why Sleep Matters for Fitness:
1. **Muscle Recovery**: Growth hormone is released during deep sleep
2. **Performance**: Better sleep = better workout performance
3. **Injury Prevention**: Tired bodies are more prone to injury
4. **Motivation**: Rest improves mental clarity and motivation

## How Much Sleep?
- Teens need **8-10 hours**
- Adults need **7-9 hours**
- Athletes often need even more!

## Sleep Hygiene Tips:
- Keep your bedroom cool (65-68°F)
- Avoid screens 1 hour before bed
- Stick to a consistent sleep schedule
- Avoid caffeine after 2pm
- Create a relaxing bedtime routine`,
          questions: [
            {
              id: "q1",
              type: "multiple_choice",
              question: "How many hours of sleep do teens need?",
              options: [
                "5-6 hours",
                "6-7 hours",
                "8-10 hours",
                "12+ hours"
              ],
              correct_answer: "8-10 hours",
              points: 10,
              explanation: "Teens need 8-10 hours of sleep for optimal recovery and performance."
            },
            {
              id: "q2",
              type: "short_answer",
              question: "Name two ways inadequate sleep can affect your fitness (in your own words).",
              correct_answer: "poor performance, slower recovery, increased injury risk, low motivation",
              points: 15,
              explanation: "Lack of sleep reduces performance, slows recovery, increases injury risk, and decreases motivation."
            }
          ],
          estimated_minutes: 25
        },
        est_minutes: 25
      },
      {
        title: "Cardio Day + Reflection",
        type: "activity",
        day: 4, // Friday
        body: {
          description: "Get your heart pumping! Choose a cardio activity you enjoy:\n• Running or jogging\n• Swimming\n• Cycling\n• Jump rope\n• Dancing\n• Rock climbing\n\nAfter your workout, reflect on your first week of structured fitness.",
          goals: {
            min_duration: 30,
            intensity: "moderate or higher",
            focus: "Cardiovascular endurance"
          }
        },
        est_minutes: 30
      },
      // Week 2
      {
        title: "Full Body Workout",
        type: "activity",
        day: 7, // Next Monday
        body: {
          description: "Focus on a well-rounded full body workout. Include:\n• Upper body (push-ups, pull-ups, or pressing)\n• Lower body (squats, lunges)\n• Core (planks, crunches)",
          goals: {
            min_duration: 35,
            intensity: "moderate to vigorous",
            focus: "Full body strength"
          }
        },
        est_minutes: 35
      },
      {
        title: "Carbs: Energy for Training",
        type: "assignment",
        day: 8, // Tuesday
        body: {
          instructions: "Understand how carbohydrates fuel your workouts.",
          reading_materials: `# Carbohydrates: Your Body's Fuel

Carbs often get a bad reputation, but they're essential for anyone working out regularly!

## What Carbs Do:
- Primary energy source for workouts
- Restore glycogen (energy storage) in muscles
- Improve performance and endurance

## Simple vs Complex Carbs:

**Simple Carbs** (quick energy):
- Fruit, honey, sports drinks
- Best: Before/during intense workouts

**Complex Carbs** (sustained energy):
- Oats, brown rice, sweet potatoes, whole grain bread
- Best: Regular meals throughout the day

## Timing Your Carbs:
- **Pre-workout** (1-3 hours before): Complex carbs for sustained energy
- **Post-workout** (within 30 min): Simple + protein for recovery
- **Rest days**: Moderate carb intake

## How Much?
Active people typically need:
- **2-3 grams per pound** of body weight daily
- More on heavy training days
- Less on rest days`,
          questions: [
            {
              id: "q1",
              type: "multiple_choice",
              question: "What's the main role of carbohydrates in fitness?",
              options: [
                "Building muscle",
                "Providing energy for workouts",
                "Improving sleep",
                "Reducing inflammation"
              ],
              correct_answer: "Providing energy for workouts",
              points: 10,
              explanation: "Carbohydrates are your body's primary fuel source for physical activity."
            },
            {
              id: "q2",
              type: "multiple_choice",
              question: "Which type of carb is best for quick energy before an intense workout?",
              options: [
                "Complex carbs like oatmeal",
                "Simple carbs like fruit",
                "No carbs needed",
                "Only protein"
              ],
              correct_answer: "Simple carbs like fruit",
              points: 10,
              explanation: "Simple carbs provide quick-releasing energy ideal for immediate fuel."
            }
          ],
          estimated_minutes: 20
        },
        est_minutes: 20
      },
      {
        title: "Active Recovery Day",
        type: "activity",
        day: 9, // Wednesday
        body: {
          description: "Today is about active recovery - light movement that helps your body recover:\n• Gentle yoga or stretching (20+ min)\n• Easy walk or swim\n• Foam rolling session\n\nThe goal is movement without pushing hard.",
          goals: {
            min_duration: 20,
            intensity: "light",
            focus: "Recovery and flexibility"
          }
        },
        est_minutes: 20
      }
    ];

    // Get the start date (today)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);

    // Create curriculum items and assignments
    const createdAssignments = [];

    for (const item of newCurriculum) {
      const assignedDate = new Date(startDate);
      assignedDate.setDate(assignedDate.getDate() + item.day);

      // Create curriculum item
      const { data: curriculumItem, error: itemError } = await supabase
        .from('curriculum_items')
        .insert({
          course_id: courseId,
          title: item.title,
          body: item.body,
          type: item.type,
          est_minutes: item.est_minutes
        })
        .select()
        .single();

      if (itemError) {
        console.error('Error creating curriculum item:', itemError);
        continue;
      }

      // Create assignment
      const dueDate = new Date(assignedDate);
      dueDate.setHours(23, 59, 59);

      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          curriculum_item_id: curriculumItem.id,
          status: 'published',
          assigned_date: assignedDate.toISOString().split('T')[0],
          due_at: dueDate.toISOString()
        })
        .select()
        .single();

      if (assignmentError) {
        console.error('Error creating assignment:', assignmentError);
        continue;
      }

      createdAssignments.push({
        ...assignment,
        curriculum_item: curriculumItem
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${createdAssignments.length} new assignments`,
        assignments: createdAssignments
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error regenerating PE course:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
