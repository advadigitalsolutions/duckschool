import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Clock, Activity, Coffee, Eye } from 'lucide-react';

interface SessionStatsCardProps {
  studentId: string;
  dateRange?: { start: Date; end: Date };
}

export function SessionStatsCard({ studentId, dateRange }: SessionStatsCardProps) {
  const [stats, setStats] = useState({
    totalActive: 0,
    totalIdle: 0,
    totalAway: 0,
    sessionCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [studentId, dateRange]);

  const fetchStats = async () => {
    try {
      let query = supabase
        .from('learning_sessions')
        .select('total_active_seconds, total_idle_seconds, total_away_seconds')
        .eq('student_id', studentId);

      if (dateRange) {
        query = query
          .gte('session_start', dateRange.start.toISOString())
          .lte('session_start', dateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const totalActive = data.reduce((sum, s) => sum + (s.total_active_seconds || 0), 0);
        const totalIdle = data.reduce((sum, s) => sum + (s.total_idle_seconds || 0), 0);
        const totalAway = data.reduce((sum, s) => sum + (s.total_away_seconds || 0), 0);

        setStats({
          totalActive,
          totalIdle,
          totalAway,
          sessionCount: data.length
        });
      }
    } catch (error) {
      console.error('Error fetching session stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const totalSeconds = stats.totalActive + stats.totalIdle + stats.totalAway;
  const activePercent = totalSeconds > 0 ? ((stats.totalActive / totalSeconds) * 100).toFixed(1) : 0;
  const idlePercent = totalSeconds > 0 ? ((stats.totalIdle / totalSeconds) * 100).toFixed(1) : 0;
  const awayPercent = totalSeconds > 0 ? ((stats.totalAway / totalSeconds) * 100).toFixed(1) : 0;

  const chartData = [
    { name: 'Active', value: stats.totalActive, color: 'hsl(var(--success))' },
    { name: 'Idle', value: stats.totalIdle, color: 'hsl(var(--warning))' },
    { name: 'Away', value: stats.totalAway, color: 'hsl(var(--destructive))' }
  ].filter(item => item.value > 0);

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
        <CardTitle>Focus Time Breakdown</CardTitle>
        <CardDescription>
          {stats.sessionCount} session{stats.sessionCount !== 1 ? 's' : ''} · Total: {formatTime(totalSeconds)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatTime(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground">No data available</div>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Active Time</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatTime(stats.totalActive)}</div>
                <div className="text-xs text-muted-foreground">{activePercent}%</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Idle Time</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatTime(stats.totalIdle)}</div>
                <div className="text-xs text-muted-foreground">{idlePercent}%</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Away Time</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatTime(stats.totalAway)}</div>
                <div className="text-xs text-muted-foreground">{awayPercent}%</div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Focus Efficiency</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary">{activePercent}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
