import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting weekly curriculum generation for all courses...');

    // Get all courses that have auto-generation enabled
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, student_id, next_generation_date')
      .eq('auto_generate_weekly', true)
      .eq('archived', false);

    if (coursesError) throw coursesError;

    if (!courses || courses.length === 0) {
      console.log('No courses with auto-generation enabled');
      return new Response(
        JSON.stringify({ message: 'No courses to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const results = [];

    // Process each course
    for (const course of courses) {
      try {
        // Check if it's time to generate for this course
        if (course.next_generation_date && course.next_generation_date > today) {
          console.log(`Skipping course ${course.id}, not due yet`);
          continue;
        }

        // Calculate next Monday
        const now = new Date();
        const daysUntilMonday = (8 - now.getDay()) % 7;
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
        const weekStartDate = nextMonday.toISOString().split('T')[0];

        // Call the generation function
        const { data, error } = await supabase.functions.invoke('generate-weekly-curriculum', {
          body: {
            courseId: course.id,
            studentId: course.student_id,
            weekStartDate
          }
        });

        if (error) {
          console.error(`Error generating for course ${course.id}:`, error);
          results.push({
            courseId: course.id,
            success: false,
            error: error.message
          });
          continue;
        }

        // Update next generation date (7 days from now)
        const nextGenDate = new Date(now);
        nextGenDate.setDate(now.getDate() + 7);
        
        await supabase
          .from('courses')
          .update({ next_generation_date: nextGenDate.toISOString().split('T')[0] })
          .eq('id', course.id);

        results.push({
          courseId: course.id,
          success: true,
          weekStartDate,
          assignmentsCreated: data?.assignments?.length || 0
        });

        console.log(`Successfully generated week for course ${course.id}`);
      } catch (error: any) {
        console.error(`Error processing course ${course.id}:`, error);
        results.push({
          courseId: course.id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Processed ${courses.length} courses`,
        successCount,
        failureCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in weekly curriculum cron:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
