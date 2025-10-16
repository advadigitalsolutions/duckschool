import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FocusSession {
  session_start: string;
  session_end: string;
  total_active_seconds: number;
  total_idle_seconds: number;
  total_away_seconds: number;
  assignment_id: string | null;
  subject: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { studentId, daysBack = 30 } = await req.json();

    if (!studentId) {
      return new Response(
        JSON.stringify({ error: 'studentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing focus patterns for student ${studentId} (last ${daysBack} days)`);

    // Fetch learning sessions with assignment/course data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: sessions, error: sessionsError } = await supabase
      .from('learning_sessions')
      .select(`
        session_start,
        session_end,
        total_active_seconds,
        total_idle_seconds,
        total_away_seconds,
        activity_events (
          assignment_id,
          assignments (
            curriculum_item_id,
            curriculum_items (
              course_id,
              courses (subject)
            )
          )
        )
      `)
      .eq('student_id', studentId)
      .gte('session_start', startDate.toISOString())
      .not('session_end', 'is', null)
      .order('session_start', { ascending: true });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sessions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sessions || sessions.length === 0) {
      console.log('No sessions found for analysis');
      return new Response(
        JSON.stringify({ message: 'No data available for analysis yet' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing ${sessions.length} sessions`);

    // Calculate focus scores for 15-minute time blocks
    const hourlyScores: Record<string, number[]> = {};
    const dayScores: Record<string, number[]> = {};
    const subjectScores: Record<string, { times: string[], scores: number[] }> = {};

    for (const session of sessions) {
      const start = new Date(session.session_start);
      const end = new Date(session.session_end);
      const duration = (end.getTime() - start.getTime()) / 1000;

      if (duration <= 0) continue;

      // Calculate focus score (0-1 scale)
      const focusScore = (
        (session.total_active_seconds / duration) * 0.7 +
        (1 - (session.total_idle_seconds / duration)) * 0.2 +
        (1 - (session.total_away_seconds / duration)) * 0.1
      );

      // Round to 15-minute blocks
      const startHour = start.getHours();
      const startMinute = Math.floor(start.getMinutes() / 15) * 15;
      const timeKey = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;

      if (!hourlyScores[timeKey]) hourlyScores[timeKey] = [];
      hourlyScores[timeKey].push(focusScore);

      // Day of week patterns
      const dayOfWeek = start.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (!dayScores[dayOfWeek]) dayScores[dayOfWeek] = [];
      dayScores[dayOfWeek].push(focusScore);

      // Subject-specific patterns (extract from activity_events)
      const events = (session as any).activity_events || [];
      for (const event of events) {
        if (event.assignments?.[0]?.curriculum_items?.[0]?.courses?.[0]?.subject) {
          const subject = event.assignments[0].curriculum_items[0].courses[0].subject;
          if (!subjectScores[subject]) subjectScores[subject] = { times: [], scores: [] };
          subjectScores[subject].times.push(timeKey);
          subjectScores[subject].scores.push(focusScore);
        }
      }
    }

    // Calculate averages
    const avgHourlyScores: Record<string, number> = {};
    for (const [time, scores] of Object.entries(hourlyScores)) {
      avgHourlyScores[time] = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    const avgDayScores: Record<string, number> = {};
    for (const [day, scores] of Object.entries(dayScores)) {
      avgDayScores[day] = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    // Find peak focus windows (consecutive blocks with >0.75 score, minimum 1 hour)
    const peakWindows = [];
    const sortedTimes = Object.keys(avgHourlyScores).sort();
    
    let windowStart = null;
    let windowScores = [];

    for (let i = 0; i < sortedTimes.length; i++) {
      const time = sortedTimes[i];
      const score = avgHourlyScores[time];

      if (score >= 0.75) {
        if (!windowStart) windowStart = time;
        windowScores.push(score);
      } else {
        if (windowStart && windowScores.length >= 4) { // 4 blocks = 1 hour
          const avgScore = windowScores.reduce((a, b) => a + b, 0) / windowScores.length;
          peakWindows.push({
            start: windowStart,
            end: sortedTimes[i - 1],
            avg_score: Math.round(avgScore * 100) / 100,
            confidence: Math.min(windowScores.length / 8, 1) // confidence increases with length
          });
        }
        windowStart = null;
        windowScores = [];
      }
    }

    // Subject performance analysis
    const subjectPerformance: Record<string, any> = {};
    for (const [subject, data] of Object.entries(subjectScores)) {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      
      // Find most common time (mode)
      const timeFreq: Record<string, number> = {};
      for (const time of data.times) {
        timeFreq[time] = (timeFreq[time] || 0) + 1;
      }
      const bestTime = Object.entries(timeFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || '09:00';
      
      // Classify as morning/afternoon/evening
      const hour = parseInt(bestTime.split(':')[0]);
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

      subjectPerformance[subject] = {
        best_time: timeOfDay,
        optimal_start: bestTime,
        avg_focus: Math.round(avgScore * 100) / 100,
        sessions_count: data.scores.length
      };
    }

    // Calculate data quality and confidence
    const dataQuality = Math.min(sessions.length / 20, 1); // 20+ sessions = full confidence
    const confidence = dataQuality * 0.8 + (Object.keys(avgHourlyScores).length / 40) * 0.2;

    // Store results in database
    const { error: insertError } = await supabase
      .from('student_focus_patterns')
      .upsert({
        student_id: studentId,
        analysis_date: new Date().toISOString().split('T')[0],
        hourly_focus_scores: avgHourlyScores,
        peak_focus_windows: peakWindows,
        subject_performance: subjectPerformance,
        day_patterns: avgDayScores,
        sessions_analyzed: sessions.length,
        data_quality_score: Math.round(dataQuality * 100) / 100,
        confidence_level: Math.round(confidence * 100) / 100,
        last_calculated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id,analysis_date'
      });

    if (insertError) {
      console.error('Error storing focus patterns:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store focus patterns' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Focus pattern analysis complete');

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          sessions_analyzed: sessions.length,
          peak_windows: peakWindows.length,
          subjects_analyzed: Object.keys(subjectPerformance).length,
          confidence_level: Math.round(confidence * 100) / 100,
          best_overall_time: peakWindows[0]?.start || 'Not enough data',
          data_quality: Math.round(dataQuality * 100) / 100
        },
        peak_windows: peakWindows,
        subject_performance: subjectPerformance,
        day_patterns: avgDayScores
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-focus-patterns function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});