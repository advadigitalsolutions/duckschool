import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting demo account setup...');

    // Get demo parent user
    const { data: parentAuth } = await supabaseClient.auth.admin.listUsers();
    const demoParent = parentAuth?.users?.find(u => u.email === 'demo-parent@duckschool.com');
    
    if (!demoParent) {
      throw new Error('Demo parent account not found. Please create demo-parent@duckschool.com first.');
    }

    // Get demo student user
    const demoStudent = parentAuth?.users?.find(u => u.email === 'demo-student@duckschool.com');
    
    if (!demoStudent) {
      throw new Error('Demo student account not found. Please create demo-student@duckschool.com first.');
    }

    console.log('Found demo accounts:', { parent: demoParent.id, student: demoStudent.id });

    // Check if student profile already exists
    const { data: existingStudent } = await supabaseClient
      .from('students')
      .select('id')
      .eq('user_id', demoStudent.id)
      .maybeSingle();

    let studentId;

    if (existingStudent) {
      console.log('Student profile already exists:', existingStudent.id);
      studentId = existingStudent.id;
    } else {
      // Create student profile linked to parent
      const { data: studentProfile, error: studentError } = await supabaseClient
        .from('students')
        .insert({
          name: 'Emma Johnson',
          display_name: 'Emma',
          grade_level: '8th Grade',
          parent_id: demoParent.id,
          user_id: demoStudent.id,
          pronouns: 'she/her',
          avatar_url: null
        })
        .select()
        .single();

      if (studentError) throw studentError;
      studentId = studentProfile.id;
      console.log('Created student profile:', studentId);
    }

    // Check if courses already exist
    const { data: existingCourses } = await supabaseClient
      .from('courses')
      .select('id, title')
      .eq('student_id', studentId);

    if (existingCourses && existingCourses.length > 0) {
      console.log('Demo courses already exist:', existingCourses.length);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Demo accounts already set up',
          studentId,
          courses: existingCourses.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create sample courses
    const courses = [
      {
        title: 'Algebra I',
        subject: 'mathematics',
        description: 'Introduction to algebraic thinking and problem solving',
        grade_level: '8th Grade',
        student_id: studentId,
        initiated_by: demoParent.id,
        initiated_by_role: 'parent',
        initiated_at: new Date().toISOString()
      },
      {
        title: 'Life Science',
        subject: 'science',
        description: 'Exploring living organisms and ecosystems',
        grade_level: '8th Grade',
        student_id: studentId,
        initiated_by: demoParent.id,
        initiated_by_role: 'parent',
        initiated_at: new Date().toISOString()
      },
      {
        title: 'U.S. History',
        subject: 'social_studies',
        description: 'American history from colonial times to present',
        grade_level: '8th Grade',
        student_id: studentId,
        initiated_by: demoParent.id,
        initiated_by_role: 'parent',
        initiated_at: new Date().toISOString()
      }
    ];

    const { data: createdCourses, error: coursesError } = await supabaseClient
      .from('courses')
      .insert(courses)
      .select();

    if (coursesError) throw coursesError;
    console.log('Created courses:', createdCourses.length);

    // Create curriculum items and assignments for each course
    for (const course of createdCourses) {
      const curriculumItems = [];
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      if (course.subject === 'mathematics') {
        curriculumItems.push(
          {
            course_id: course.id,
            title: 'Variables and Expressions',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Understanding Variables\n\nVariables are symbols (usually letters) that represent unknown or changing values in mathematical expressions. Think of a variable as a container that can hold different numbers.\n\n## What is an Expression?\n\nAn algebraic expression combines variables, numbers, and operations (like +, -, ×, ÷). For example:\n- 3x + 5\n- 2y - 7\n- 4a + 3b\n\n## Evaluating Expressions\n\nTo evaluate an expression, substitute the variable with a specific number and calculate the result.\n\n**Example:** Evaluate 3x + 5 when x = 2\n1. Replace x with 2: 3(2) + 5\n2. Multiply first: 6 + 5\n3. Add: 11\n\nSo when x = 2, the expression 3x + 5 equals 11.'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'What is 3x + 5 when x = 2?',
                      options: ['8', '11', '13', '16'],
                      correct_answer: '11',
                      explanation: 'Substitute x with 2: 3(2) + 5 = 6 + 5 = 11'
                    },
                    {
                      id: 'q2',
                      type: 'multiple_choice',
                      question: 'Evaluate 5y - 3 when y = 4',
                      options: ['12', '17', '20', '23'],
                      correct_answer: '17',
                      explanation: 'Replace y with 4: 5(4) - 3 = 20 - 3 = 17'
                    },
                    {
                      id: 'q3',
                      type: 'open_ended',
                      question: 'Write an expression for "six more than twice a number n"',
                      rubric: 'Award points for 2n + 6 or equivalent forms like 6 + 2n'
                    }
                  ]
                }
              ]
            },
            est_minutes: 45
          },
          {
            course_id: course.id,
            title: 'Solving Linear Equations',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Solving Linear Equations\n\nA linear equation is an equation where the variable has an exponent of 1. Our goal is to isolate the variable on one side of the equation.\n\n## The Balance Principle\n\nThink of an equation like a balance scale - whatever you do to one side, you must do to the other to keep it balanced.\n\n## Steps to Solve One-Step Equations\n\n**Example 1:** x + 7 = 12\n- Subtract 7 from both sides: x + 7 - 7 = 12 - 7\n- Simplify: x = 5\n\n**Example 2:** 3x = 15\n- Divide both sides by 3: 3x ÷ 3 = 15 ÷ 3\n- Simplify: x = 5\n\n## Two-Step Equations\n\n**Example:** 2x + 3 = 11\n1. Subtract 3 from both sides: 2x = 8\n2. Divide both sides by 2: x = 4\n\n**Check your answer:** 2(4) + 3 = 8 + 3 = 11 ✓'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'Solve for x: x + 9 = 15',
                      options: ['4', '6', '24', '135'],
                      correct_answer: '6',
                      explanation: 'Subtract 9 from both sides: x = 15 - 9 = 6'
                    },
                    {
                      id: 'q2',
                      type: 'multiple_choice',
                      question: 'Solve for y: 4y = 28',
                      options: ['7', '24', '32', '112'],
                      correct_answer: '7',
                      explanation: 'Divide both sides by 4: y = 28 ÷ 4 = 7'
                    }
                  ]
                }
              ]
            },
            est_minutes: 60
          }
        );
      } else if (course.subject === 'science') {
        curriculumItems.push(
          {
            course_id: course.id,
            title: 'Cell Structure',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Cell Structure: The Building Blocks of Life\n\nCells are the smallest units of life. All living things are made up of one or more cells!\n\n## Two Types of Cells\n\n### Plant Cells\nPlant cells have several unique structures:\n- **Cell Wall**: A rigid outer layer that provides structure and protection\n- **Chloroplasts**: Contain chlorophyll (the green pigment) and perform photosynthesis\n- **Large Central Vacuole**: Stores water and helps maintain cell shape\n\n### Animal Cells\nAnimal cells are more flexible and include:\n- **Cell Membrane**: Controls what enters and exits the cell\n- **Smaller Vacuoles**: Store nutrients and waste products\n- **No cell wall**: Makes animal cells more flexible\n\n## Structures Common to Both\n\nBoth plant and animal cells contain:\n- **Nucleus**: The "control center" containing DNA\n- **Mitochondria**: The "powerhouse" that produces energy\n- **Cytoplasm**: Jelly-like substance where cellular activities occur\n- **Ribosomes**: Make proteins for the cell\n\n## Why Does Structure Matter?\n\nThe structure of a cell determines its function. For example, plant cells need chloroplasts to make food through photosynthesis, while animal cells get their food by eating other organisms.'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'Which organelle is responsible for photosynthesis?',
                      options: ['Nucleus', 'Mitochondria', 'Chloroplast', 'Ribosome'],
                      correct_answer: 'Chloroplast',
                      explanation: 'Chloroplasts contain chlorophyll and perform photosynthesis, converting sunlight into energy for the plant.'
                    },
                    {
                      id: 'q2',
                      type: 'multiple_choice',
                      question: 'What is the "control center" of the cell?',
                      options: ['Cell membrane', 'Nucleus', 'Cytoplasm', 'Vacuole'],
                      correct_answer: 'Nucleus',
                      explanation: 'The nucleus contains DNA and controls all cellular activities.'
                    },
                    {
                      id: 'q3',
                      type: 'open_ended',
                      question: 'Explain one major difference between plant and animal cells.',
                      rubric: 'Award points for mentioning cell wall, chloroplasts, or vacuole size differences with clear explanation.'
                    }
                  ]
                }
              ]
            },
            est_minutes: 50
          }
        );
      } else if (course.subject === 'social_studies') {
        curriculumItems.push(
          {
            course_id: course.id,
            title: 'Colonial America',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Colonial America: Life in the Thirteen Colonies\n\nBetween 1607 and 1733, England established thirteen colonies along the Atlantic coast of North America. These colonies would eventually become the United States of America.\n\n## The Three Colonial Regions\n\n### New England Colonies\n- Massachusetts, Rhode Island, Connecticut, New Hampshire\n- Rocky soil, cold winters\n- Economy: Fishing, shipbuilding, trade\n- Known for town meetings and strong community ties\n\n### Middle Colonies\n- New York, New Jersey, Pennsylvania, Delaware\n- Fertile soil, moderate climate\n- Economy: Farming (wheat, corn), trade\n- Called the "Breadbasket Colonies"\n- Most religiously diverse region\n\n### Southern Colonies\n- Maryland, Virginia, North Carolina, South Carolina, Georgia\n- Warm climate, long growing season\n- Economy: Large plantations growing tobacco, rice, indigo\n- Relied heavily on enslaved labor\n\n## Daily Life in Colonial America\n\n**Children**: Most children worked on farms or as apprentices. Only wealthy children attended school regularly.\n\n**Women**: Managed households, made clothing, preserved food, and taught children. Had limited legal rights.\n\n**Men**: Worked as farmers, craftsmen, merchants, or in trades. Only property-owning men could vote.\n\n## Why Did People Come?\n\nColonists came to America for:\n- Religious freedom (Pilgrims, Puritans, Quakers)\n- Economic opportunity (land ownership, trade)\n- Escape from debt or poverty\n- Some came involuntarily as enslaved people'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'Which colonial region was known as the "Breadbasket Colonies"?',
                      options: ['New England', 'Middle Colonies', 'Southern Colonies', 'All regions equally'],
                      correct_answer: 'Middle Colonies',
                      explanation: 'The Middle Colonies had fertile soil perfect for growing wheat and corn, earning them this nickname.'
                    },
                    {
                      id: 'q2',
                      type: 'multiple_choice',
                      question: 'What was the main economy of the Southern Colonies?',
                      options: ['Fishing and shipbuilding', 'Wheat farming', 'Large plantations', 'Manufacturing'],
                      correct_answer: 'Large plantations',
                      explanation: 'The Southern Colonies had large plantations that grew cash crops like tobacco, rice, and indigo.'
                    },
                    {
                      id: 'q3',
                      type: 'open_ended',
                      question: 'Why might someone choose to leave England and move to the colonies in the 1600s?',
                      rubric: 'Award points for mentioning religious freedom, economic opportunity, land ownership, or escape from debt/poverty.'
                    }
                  ]
                }
              ]
            },
            est_minutes: 55
          }
        );
      }

      if (curriculumItems.length > 0) {
        const { data: createdItems, error: itemsError } = await supabaseClient
          .from('curriculum_items')
          .insert(curriculumItems)
          .select();

        if (itemsError) throw itemsError;
        console.log(`Created ${createdItems.length} curriculum items for ${course.title}`);

        // Create assignments for each curriculum item with dates spread across the next 2 weeks
        const assignmentsToCreate = createdItems.map((item, index) => {
          const daysAhead = index + 1; // Start from tomorrow
          const assignDate = new Date(today);
          assignDate.setDate(assignDate.getDate() + daysAhead);
          const dueDate = new Date(assignDate);
          dueDate.setDate(dueDate.getDate() + 1); // Due the next day

          return {
            curriculum_item_id: item.id,
            status: 'assigned',
            due_at: dueDate.toISOString(),
            assigned_date: assignDate.toISOString().split('T')[0]
          };
        });

        if (assignmentsToCreate.length > 0) {
          const { error: assignmentError } = await supabaseClient
            .from('assignments')
            .insert(assignmentsToCreate);

          if (assignmentError) throw assignmentError;
          console.log(`Created ${assignmentsToCreate.length} assignments for ${course.title}`);
        }
      }
    }

    // Add some parent todo items
    const todayForTodos = new Date();
    const tomorrowForTodos = new Date(todayForTodos);
    tomorrowForTodos.setDate(tomorrowForTodos.getDate() + 1);
    const nextWeekForTodos = new Date(todayForTodos);
    nextWeekForTodos.setDate(nextWeekForTodos.getDate() + 7);

    const parentTodos = [
      {
        parent_id: demoParent.id,
        title: "Review student's algebra homework",
        description: 'Check their work on linear equations worksheet',
        priority: 'high',
        due_date: tomorrowForTodos.toISOString().split('T')[0]
      },
      {
        parent_id: demoParent.id,
        title: 'Order science lab supplies',
        description: 'Need materials for cell model project',
        priority: 'medium',
        due_date: nextWeekForTodos.toISOString().split('T')[0]
      },
      {
        parent_id: demoParent.id,
        title: 'Plan field trip to history museum',
        description: 'Colonial America exhibit opens next month',
        priority: 'low',
        due_date: null
      }
    ];

    const { error: todosError } = await supabaseClient
      .from('parent_todo_items')
      .insert(parentTodos);

    if (todosError) throw todosError;
    console.log('Created parent todo items');

    // Create a reward for the demo
    const { error: rewardError } = await supabaseClient
      .from('rewards')
      .insert({
        parent_id: demoParent.id,
        title: 'Extra Screen Time',
        description: '30 minutes of extra screen time',
        xp_cost: 100,
        emoji: '📱',
        requires_approval: false,
        active: true
      });

    if (rewardError) console.error('Error creating reward:', rewardError);

    console.log('Demo account setup complete!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo accounts set up successfully!',
        studentId,
        courses: createdCourses.length,
        parentId: demoParent.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error setting up demo accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
