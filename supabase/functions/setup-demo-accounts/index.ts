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
            title: 'Order of Operations',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Order of Operations\n\nWhen solving complex expressions, we must follow a specific order to get the correct answer every time!\n\n## PEMDAS\n\nRemember: **Please Excuse My Dear Aunt Sally**\n\n1. **P**arentheses - Solve anything in ( ) first\n2. **E**xponents - Calculate powers and roots\n3. **M**ultiplication and **D**ivision - Left to right\n4. **A**ddition and **S**ubtraction - Left to right\n\n## Why Order Matters\n\nLook at this expression: 3 + 4 × 2\n\n**Wrong way** (left to right): 3 + 4 = 7, then 7 × 2 = 14 ❌\n**Correct way** (PEMDAS): 4 × 2 = 8, then 3 + 8 = 11 ✓\n\n## Step-by-Step Examples\n\n**Example 1:** 15 - 3 × 2 + 8\n1. Multiply first: 3 × 2 = 6\n2. Now we have: 15 - 6 + 8\n3. Work left to right: 15 - 6 = 9\n4. Then: 9 + 8 = 17\n\n**Example 2:** (8 + 2) × 3 - 5\n1. Parentheses first: (8 + 2) = 10\n2. Multiply: 10 × 3 = 30\n3. Subtract: 30 - 5 = 25'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'What is 12 ÷ 3 + 2 × 5?',
                      options: ['14', '17', '20', '24'],
                      correct_answer: '14',
                      explanation: '12 ÷ 3 = 4, then 2 × 5 = 10, finally 4 + 10 = 14'
                    }
                  ]
                }
              ]
            },
            est_minutes: 40
          },
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
                    }
                  ]
                }
              ]
            },
            est_minutes: 45
          },
          {
            course_id: course.id,
            title: 'Graphing Linear Equations',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Graphing Linear Equations\n\nGraphing helps us visualize the relationship between variables in an equation. A linear equation creates a straight line when graphed!\n\n## Slope-Intercept Form\n\nThe most common form for graphing is **y = mx + b** where:\n- **m** = slope (steepness of the line)\n- **b** = y-intercept (where the line crosses the y-axis)\n\n### Understanding Slope\n\nSlope measures how steep a line is:\n- **Positive slope**: Line goes up from left to right\n- **Negative slope**: Line goes down from left to right\n- **Zero slope**: Horizontal line\n- **Undefined slope**: Vertical line'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'What is the y-intercept of the equation y = 3x + 4?',
                      options: ['3', '4', '7', '12'],
                      correct_answer: '4',
                      explanation: 'In y = mx + b form, b is the y-intercept. Here b = 4.'
                    }
                  ]
                }
              ]
            },
            est_minutes: 50
          },
          {
            course_id: course.id,
            title: 'Solving Linear Equations',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Solving Linear Equations\n\nA linear equation is an equation where the variable has an exponent of 1. Our goal is to isolate the variable on one side of the equation.\n\n## The Balance Principle\n\nThink of an equation like a balance scale - whatever you do to one side, you must do to the other to keep it balanced.\n\n## Steps to Solve\n\n**Example:** 2x + 3 = 11\n1. Subtract 3 from both sides: 2x = 8\n2. Divide both sides by 2: x = 4'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'Solve for x: x + 9 = 15',
                      options: ['4', '6', '24', '135'],
                      correct_answer: '6'
                    }
                  ]
                }
              ]
            },
            est_minutes: 60
          },
          {
            course_id: course.id,
            title: 'Systems of Equations',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Systems of Equations\n\nA system of equations is two or more equations with the same variables. The solution is the point where all equations intersect!\n\n## Substitution Method\n\n**Example:** Solve x + y = 7 and 2x - y = 5\n1. Solve first equation for y: y = 7 - x\n2. Substitute: 2x - (7 - x) = 5\n3. Solve: 3x = 12, so x = 4\n4. Find y: y = 3\n\n**Solution: (4, 3)**'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'What is x in the system: x + y = 10 and x - y = 2?',
                      options: ['4', '6', '8', '12'],
                      correct_answer: '6'
                    }
                  ]
                }
              ]
            },
            est_minutes: 60
          },
          {
            course_id: course.id,
            title: 'Quadratic Functions',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Quadratic Functions\n\nQuadratic functions create U-shaped curves called parabolas. They model many real-world situations like the path of a thrown ball!\n\n## Standard Form\n\nA quadratic function has the form: **y = ax² + bx + c**\n\n- **a** determines if the parabola opens up (a > 0) or down (a < 0)\n- **c** is the y-intercept\n- The highest or lowest point is called the **vertex**'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'For y = -2x² + 4, does the parabola open up or down?',
                      options: ['Up', 'Down', 'Left', 'Right'],
                      correct_answer: 'Down'
                    }
                  ]
                }
              ]
            },
            est_minutes: 55
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
                  content: '# Cell Structure: The Building Blocks of Life\n\nCells are the smallest units of life. All living things are made up of one or more cells!\n\n## Two Types of Cells\n\n### Plant Cells\nPlant cells have several unique structures:\n- **Cell Wall**: A rigid outer layer that provides structure and protection\n- **Chloroplasts**: Contain chlorophyll (the green pigment) and perform photosynthesis\n- **Large Central Vacuole**: Stores water and helps maintain cell shape\n\n### Animal Cells\nAnimal cells are more flexible and include:\n- **Cell Membrane**: Controls what enters and exits the cell\n- **Smaller Vacuoles**: Store nutrients and waste products\n- **No cell wall**: Makes animal cells more flexible\n\n## Structures Common to Both\n\nBoth plant and animal cells contain:\n- **Nucleus**: The "control center" containing DNA\n- **Mitochondria**: The "powerhouse" that produces energy\n- **Cytoplasm**: Jelly-like substance where cellular activities occur'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'Which organelle is responsible for photosynthesis?',
                      options: ['Nucleus', 'Mitochondria', 'Chloroplast', 'Ribosome'],
                      correct_answer: 'Chloroplast'
                    }
                  ]
                }
              ]
            },
            est_minutes: 50
          },
          {
            course_id: course.id,
            title: 'Photosynthesis',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Photosynthesis: How Plants Make Food\n\nPhotosynthesis converts sunlight into chemical energy. Plants use carbon dioxide, water, and light to create glucose and oxygen.\n\n## The Equation\n**6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂**\n\n## Where It Happens\nChloroplasts contain chlorophyll (green pigment) that captures light energy.'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'What gas do plants take IN during photosynthesis?',
                      options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
                      correct_answer: 'Carbon dioxide'
                    }
                  ]
                }
              ]
            },
            est_minutes: 45
          },
          {
            course_id: course.id,
            title: 'Ecosystems',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Ecosystems: Interconnected Life\n\nAn ecosystem includes all living (biotic) and non-living (abiotic) things interacting in an area.\n\n## Components\n- **Producers** (plants): Make food through photosynthesis\n- **Consumers** (animals): Eat other organisms\n- **Decomposers**: Break down dead organisms\n\n## Energy Flow\nEnergy flows one direction: Sun → Producers → Consumers → Decomposers'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'What role do decomposers play?',
                      options: ['Make food from sunlight', 'Break down dead organisms', 'Eat only plants', 'Hunt other animals'],
                      correct_answer: 'Break down dead organisms'
                    }
                  ]
                }
              ]
            },
            est_minutes: 50
          },
          {
            course_id: course.id,
            title: 'Genetics and Heredity',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Genetics and Heredity\n\nGenetics is the study of how traits pass from parents to offspring through DNA and genes.\n\n## Key Concepts\n- **DNA**: Molecule carrying genetic information\n- **Genes**: Sections of DNA coding for traits\n- **Chromosomes**: Humans have 46 (23 pairs)\n\n## Dominant vs Recessive\n- **Dominant**: Need only ONE copy to show (ex: brown eyes)\n- **Recessive**: Need TWO copies to show (ex: blue eyes)'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'How many chromosomes does a human have?',
                      options: ['23', '44', '46', '92'],
                      correct_answer: '46'
                    }
                  ]
                }
              ]
            },
            est_minutes: 60
          },
          {
            course_id: course.id,
            title: 'Human Body Systems',
            type: 'project',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Human Body Systems Project\n\n## Project Overview\n\nCreate a comprehensive presentation showcasing how different body systems work together!\n\n## Your Mission\n\nChoose TWO body systems and explain:\n1. Main organs and functions\n2. How the system works\n3. Connections to other systems\n4. Common diseases\n5. How to stay healthy\n\n## Systems Options\n- Circulatory, Respiratory, Digestive, Nervous, Skeletal, Muscular\n\n## Requirements\n- Research with 3+ sources\n- Visual diagrams\n- Explain system interactions\n- Health recommendations'
                }
              ]
            },
            est_minutes: 120
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
                  content: '# Colonial America: Life in the Thirteen Colonies\n\nBetween 1607 and 1733, England established thirteen colonies along the Atlantic coast. These would become the United States.\n\n## Three Regions\n\n### New England Colonies\n- Massachusetts, Rhode Island, Connecticut, New Hampshire\n- Economy: Fishing, shipbuilding, trade\n\n### Middle Colonies\n- New York, New Jersey, Pennsylvania, Delaware\n- Called the "Breadbasket Colonies"\n- Most diverse region\n\n### Southern Colonies\n- Maryland, Virginia, Carolinas, Georgia\n- Large plantations\n- Relied on enslaved labor'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'Which region was known as the "Breadbasket Colonies"?',
                      options: ['New England', 'Middle Colonies', 'Southern Colonies', 'All equally'],
                      correct_answer: 'Middle Colonies'
                    }
                  ]
                }
              ]
            },
            est_minutes: 55
          },
          {
            course_id: course.id,
            title: 'American Revolution',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# The American Revolution (1775-1783)\n\nThe war that created the United States as thirteen colonies fought for independence from Britain.\n\n## Causes\n- Taxation without representation\n- Boston Tea Party (1773)\n- Intolerable Acts\n\n## Key Events\n- **April 19, 1775**: Lexington and Concord\n- **July 4, 1776**: Declaration of Independence\n- **1777**: Battle of Saratoga (turning point)\n- **1781**: Victory at Yorktown\n- **1783**: Treaty of Paris'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'What date was the Declaration of Independence signed?',
                      options: ['July 4, 1775', 'July 4, 1776', 'July 4, 1783', 'July 4, 1787'],
                      correct_answer: 'July 4, 1776'
                    }
                  ]
                }
              ]
            },
            est_minutes: 50
          },
          {
            course_id: course.id,
            title: 'Constitution and Bill of Rights',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# The Constitution and Bill of Rights\n\nThe Constitution is the supreme law establishing our government structure.\n\n## Three Branches\n- **Legislative**: Congress makes laws\n- **Executive**: President enforces laws\n- **Judicial**: Courts interpret laws\n\n## Checks and Balances\nEach branch can limit the powers of the others.\n\n## Bill of Rights (First 10 Amendments)\n1. Freedom of religion, speech, press\n2. Right to bear arms\n3. No quartering soldiers\n4. No unreasonable searches\n5. Rights of accused'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'Which branch makes laws?',
                      options: ['Executive', 'Legislative', 'Judicial', 'Presidential'],
                      correct_answer: 'Legislative'
                    }
                  ]
                }
              ]
            },
            est_minutes: 55
          },
          {
            course_id: course.id,
            title: 'Civil War Era',
            type: 'lesson',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# The Civil War Era (1861-1865)\n\nThe deadliest conflict in American history, fought between Union (North) and Confederacy (South) over slavery.\n\n## Causes\n- Slavery expansion to new states\n- States rights vs federal power\n- Economic differences (industrial North vs agricultural South)\n\n## Key Events\n- **1861**: Fort Sumter, war begins\n- **1863**: Emancipation Proclamation, Gettysburg\n- **1865**: Lee surrenders, Lincoln assassinated\n\n## Results\n- Slavery abolished (13th Amendment)\n- Union preserved\n- 620,000+ died'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'What was the main cause of the Civil War?',
                      options: ['Taxes', 'Slavery', 'Religion', 'Trade'],
                      correct_answer: 'Slavery'
                    }
                  ]
                }
              ]
            },
            est_minutes: 50
          },
          {
            course_id: course.id,
            title: 'Westward Expansion',
            type: 'assignment',
            body: {
              sections: [
                {
                  type: 'text',
                  content: '# Westward Expansion\n\nIn the 1800s, millions moved west, expanding America from Atlantic to Pacific.\n\n## Reasons\n- Manifest Destiny belief\n- Gold rushes\n- Cheap land (Homestead Act)\n- Economic opportunity\n\n## How They Traveled\n- Oregon Trail (2,000 miles, 4-6 months)\n- Transcontinental Railroad (1869)\n\n## Impact on Native Americans\n- Forced removal from lands\n- Trail of Tears\n- Broken treaties\n- Buffalo slaughter\n- Reservation system'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'What was the main route to Oregon?',
                      options: ['Santa Fe Trail', 'Oregon Trail', 'Silk Road', 'Route 66'],
                      correct_answer: 'Oregon Trail'
                    }
                  ]
                }
              ]
            },
            est_minutes: 50
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
