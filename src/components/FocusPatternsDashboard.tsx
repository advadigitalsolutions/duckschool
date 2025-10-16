import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Brain, TrendingUp, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FocusPattern {
  hourly_focus_scores: Record<string, number>;
  peak_focus_windows: Array<{
    start: string;
    end: string;
    avg_score: number;
    confidence: number;
  }>;
  subject_performance: Record<string, {
    best_time: string;
    optimal_start: string;
    avg_focus: number;
    sessions_count: number;
  }>;
  day_patterns: Record<string, number>;
  sessions_analyzed: number;
  confidence_level: number;
  data_quality_score: number;
  last_calculated_at: string;
}

interface FocusPatternsDashboardProps {
  studentId: string;
}

export function FocusPatternsDashboard({ studentId }: FocusPatternsDashboardProps) {
  const [patterns, setPatterns] = useState<FocusPattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const fetchPatterns = async () => {
    try {
      const { data, error } = await supabase
        .from('student_focus_patterns')
        .select('*')
        .eq('student_id', studentId)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setPatterns(data as unknown as FocusPattern);
    } catch (error) {
      console.error('Error fetching focus patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-focus-patterns', {
        body: { studentId, daysBack: 30 }
      });

      if (error) throw error;

      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${data.summary.sessions_analyzed} learning sessions`,
      });

      await fetchPatterns();
    } catch (error) {
      console.error('Error analyzing focus patterns:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not analyze focus patterns. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, [studentId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!patterns || patterns.sessions_analyzed === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Focus Intelligence
          </CardTitle>
          <CardDescription>
            AI-powered insights about optimal learning times
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Not enough learning session data yet. The system needs at least a few days of activity to identify focus patterns.
            </AlertDescription>
          </Alert>
          <Button onClick={runAnalysis} disabled={analyzing}>
            {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getConfidenceBadge = () => {
    const confidence = patterns.confidence_level;
    if (confidence >= 0.8) return <Badge variant="default">High Confidence</Badge>;
    if (confidence >= 0.5) return <Badge variant="secondary">Medium Confidence</Badge>;
    return <Badge variant="outline">Low Confidence</Badge>;
  };

  const getTimeOfDayEmoji = (time: string) => {
    if (time === 'morning') return '🌅';
    if (time === 'afternoon') return '☀️';
    return '🌙';
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Focus Intelligence
              </CardTitle>
              <CardDescription>
                AI-analyzed patterns from {patterns.sessions_analyzed} learning sessions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getConfidenceBadge()}
              <Button onClick={runAnalysis} disabled={analyzing} variant="outline" size="sm">
                {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {analyzing ? 'Analyzing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Peak Focus Windows */}
      {patterns.peak_focus_windows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Peak Focus Windows
            </CardTitle>
            <CardDescription>
              Times when the student shows highest engagement and focus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patterns.peak_focus_windows.slice(0, 3).map((window, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 font-mono text-lg">
                      <Clock className="h-4 w-4" />
                      {window.start} - {window.end}
                    </div>
                    <Badge variant="outline">
                      {Math.round(window.avg_score * 100)}% focus
                    </Badge>
                  </div>
                  {idx === 0 && (
                    <Badge className="bg-green-500">
                      Best Time ⚡
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <Alert className="mt-4">
              <AlertDescription>
                💡 <strong>Scheduling Tip:</strong> Schedule challenging assignments during {patterns.peak_focus_windows[0]?.start} - {patterns.peak_focus_windows[0]?.end} for best results
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Subject-Specific Performance */}
      {Object.keys(patterns.subject_performance).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Subject-Specific Optimal Times
            </CardTitle>
            <CardDescription>
              When each subject shows peak engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(patterns.subject_performance).map(([subject, perf]) => (
                <div
                  key={subject}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {getTimeOfDayEmoji(perf.best_time)} {subject}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Best at {perf.optimal_start} ({perf.best_time})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {Math.round(perf.avg_focus * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {perf.sessions_count} sessions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day of Week Patterns */}
      {Object.keys(patterns.day_patterns).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Focus Patterns</CardTitle>
            <CardDescription>
              Average focus levels by day of week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(patterns.day_patterns)
                .sort((a, b) => {
                  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                  return days.indexOf(a[0]) - days.indexOf(b[0]);
                })
                .map(([day, score]) => (
                  <div key={day} className="flex items-center gap-3">
                    <div className="w-24 capitalize">{day}</div>
                    <div className="flex-1 h-8 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${score * 100}%` }}
                      />
                    </div>
                    <div className="w-12 text-right font-mono">
                      {Math.round(score * 100)}%
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Heatmap Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Focus Heatmap</CardTitle>
          <CardDescription>
            Focus intensity patterns throughout the day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={Object.entries(patterns.hourly_focus_scores)
                .sort((a, b) => {
                  const hourA = parseInt(a[0].split(':')[0]);
                  const hourB = parseInt(b[0].split(':')[0]);
                  return hourA - hourB;
                })
                .map(([time, score]) => {
                  const hour = parseInt(time.split(':')[0]);
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                  return {
                    time: `${displayHour}${ampm}`,
                    focus: Math.round(score * 100),
                    rawScore: score
                  };
                })}
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
              <div className="w-4 h-4 bg-green-500 rounded" />
            </div>
            <span>Higher Focus</span>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Last analyzed: {new Date(patterns.last_calculated_at).toLocaleDateString()}
            </span>
            <span className="text-muted-foreground">
              Data quality: {Math.round(patterns.data_quality_score * 100)}%
              {patterns.data_quality_score < 0.5 && ' (More data needed for better insights)'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}