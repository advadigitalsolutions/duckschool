import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';

interface ActivityTimelineChartProps {
  studentId: string;
  days?: number;
}

export function ActivityTimelineChart({ studentId, days = 7 }: ActivityTimelineChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityData();
  }, [studentId, days]);

  const fetchActivityData = async () => {
    try {
      const startDate = subDays(new Date(), days - 1);
      startDate.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('learning_sessions')
        .select('session_start, total_active_seconds, total_idle_seconds, total_away_seconds')
        .eq('student_id', studentId)
        .gte('session_start', startDate.toISOString())
        .order('session_start', { ascending: true });

      if (error) throw error;

      // Group by day
      const dailyData = new Map<string, { active: number; idle: number; away: number }>();

      // Initialize all days in range
      for (let i = 0; i < days; i++) {
        const date = subDays(new Date(), days - 1 - i);
        const dateKey = format(date, 'MMM d');
        dailyData.set(dateKey, { active: 0, idle: 0, away: 0 });
      }

      // Aggregate session data
      data?.forEach((session) => {
        const dateKey = format(new Date(session.session_start), 'MMM d');
        const existing = dailyData.get(dateKey) || { active: 0, idle: 0, away: 0 };
        dailyData.set(dateKey, {
          active: existing.active + (session.total_active_seconds || 0),
          idle: existing.idle + (session.total_idle_seconds || 0),
          away: existing.away + (session.total_away_seconds || 0)
        });
      });

      // Convert to chart format (minutes)
      const chartArray = Array.from(dailyData.entries()).map(([date, stats]) => ({
        date,
        Active: Math.round(stats.active / 60),
        Idle: Math.round(stats.idle / 60),
        Away: Math.round(stats.away / 60)
      }));

      setChartData(chartArray);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Activity Trend</CardTitle>
        <CardDescription>Last {days} days (in minutes)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Active" stackId="a" fill="hsl(var(--success))" />
            <Bar dataKey="Idle" stackId="a" fill="hsl(var(--warning))" />
            <Bar dataKey="Away" stackId="a" fill="hsl(var(--destructive))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
