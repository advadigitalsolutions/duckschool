import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
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
  const [hourlyFocusData, setHourlyFocusData] = useState<Array<{ time: string; focus: number; rawScore: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [studentId, dateRange]);

  const fetchStats = async () => {
    try {
      let query = supabase
        .from('learning_sessions')
        .select('total_active_seconds, total_idle_seconds, total_away_seconds, session_start')
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

        // Calculate hourly focus scores
        const hourlyScores: { [key: string]: { active: number; total: number } } = {};
        
        data.forEach(session => {
          if (session.session_start) {
            const hour = new Date(session.session_start).getHours();
            const hourKey = `${hour.toString().padStart(2, '0')}:00`;
            
            if (!hourlyScores[hourKey]) {
              hourlyScores[hourKey] = { active: 0, total: 0 };
            }
            
            const active = session.total_active_seconds || 0;
            const total = active + (session.total_idle_seconds || 0) + (session.total_away_seconds || 0);
            
            hourlyScores[hourKey].active += active;
            hourlyScores[hourKey].total += total;
          }
        });

        // Convert to chart data
        const chartData = Object.entries(hourlyScores)
          .sort((a, b) => {
            const hourA = parseInt(a[0].split(':')[0]);
            const hourB = parseInt(b[0].split(':')[0]);
            return hourA - hourB;
          })
          .map(([time, scores]) => {
            const hour = parseInt(time.split(':')[0]);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            const focusScore = scores.total > 0 ? scores.active / scores.total : 0;
            
            return {
              time: `${displayHour}${ampm}`,
              focus: Math.round(focusScore * 100),
              rawScore: focusScore
            };
          });

        setHourlyFocusData(chartData);
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
    { name: 'Active', value: stats.totalActive, color: '#00CC6C' },
    { name: 'Idle', value: stats.totalIdle, color: '#EEBAB2' },
    { name: 'Away', value: stats.totalAway, color: '#FF8F57' }
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
    <>
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
                  <Activity className="h-4 w-4" style={{ color: '#00CC6C' }} />
                  <span className="text-sm font-medium">Active Time</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatTime(stats.totalActive)}</div>
                  <div className="text-xs text-muted-foreground">{activePercent}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" style={{ color: '#EEBAB2' }} />
                  <span className="text-sm font-medium">Idle Time</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatTime(stats.totalIdle)}</div>
                  <div className="text-xs text-muted-foreground">{idlePercent}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" style={{ color: '#FF8F57' }} />
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

      {/* Hourly Focus Heatmap */}
      {hourlyFocusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Focus Heatmap</CardTitle>
            <CardDescription>
              Focus intensity patterns throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={hourlyFocusData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="25%" stopColor="#84cc16" stopOpacity={0.6} />
                    <stop offset="50%" stopColor="#eab308" stopOpacity={0.5} />
                    <stop offset="75%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="time" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  label={{ value: 'Focus %', angle: -90, position: 'insideLeft' }}
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Focus']}
                />
                <Area
                  type="monotone"
                  dataKey="focus"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#focusGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>Lower Focus</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <div className="w-4 h-4 bg-orange-500 rounded" />
                <div className="w-4 h-4 bg-yellow-500 rounded" />
                <div className="w-4 h-4 bg-lime-500 rounded" />
                <div className="w-4 h-4 bg-green-500 rounded" />
              </div>
              <span>Higher Focus</span>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
