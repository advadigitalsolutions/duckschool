import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SessionStatsCard } from '@/components/SessionStatsCard';
import { ActivityTimelineChart } from '@/components/ActivityTimelineChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, Target } from 'lucide-react';

export default function StudentFocusStats() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [avgFocusScore, setAvgFocusScore] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentData) {
        setStudentId(studentData.id);

        // Fetch session stats
        const { data: sessions } = await supabase
          .from('learning_sessions')
          .select('total_active_seconds, total_idle_seconds, total_away_seconds')
          .eq('student_id', studentData.id);

        if (sessions) {
          setTotalSessions(sessions.length);
          
          const minutes = sessions.reduce((sum, s) => {
            const totalSeconds = (s.total_active_seconds || 0) + 
                                (s.total_idle_seconds || 0) + 
                                (s.total_away_seconds || 0);
            return sum + totalSeconds / 60;
          }, 0);
          setTotalMinutes(Math.round(minutes));

          // Calculate average focus score
          const avgScore = sessions.reduce((sum, s) => {
            const total = (s.total_active_seconds || 0) + 
                         (s.total_idle_seconds || 0) + 
                         (s.total_away_seconds || 0);
            const score = total > 0 ? (s.total_active_seconds || 0) / total * 100 : 0;
            return sum + score;
          }, 0) / (sessions.length || 1);
          setAvgFocusScore(Math.round(avgScore));
        }
      }
    } catch (error) {
      console.error('Error fetching focus stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Activity className="h-8 w-8" />
          Focus Statistics
        </h1>
        <p className="text-muted-foreground">Your focus and learning session analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">Learning sessions completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
            </div>
            <p className="text-xs text-muted-foreground">Time spent learning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Focus Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgFocusScore}%</div>
            <p className="text-xs text-muted-foreground">Active time percentage</p>
          </CardContent>
        </Card>
      </div>

      {/* Session Stats Card */}
      {studentId && (
        <>
          <SessionStatsCard studentId={studentId} />
          <ActivityTimelineChart studentId={studentId} />
        </>
      )}
    </div>
  );
}
