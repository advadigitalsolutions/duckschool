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
                  content: 'Learn to identify and work with variables in algebraic expressions.'
                },
                {
                  type: 'practice',
                  questions: [
                    {
                      id: 'q1',
                      type: 'multiple_choice',
                      question: 'What is 3x + 5 when x = 2?',
                      options: ['8', '11', '13', '16'],
                      correct_answer: '11'
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
                  content: 'Master the steps to solve one-step and two-step equations.'
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
                  content: 'Explore the components of plant and animal cells.'
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
                  content: 'Learn about the thirteen colonies and early American life.'
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
