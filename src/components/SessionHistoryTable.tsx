import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, isSameDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SessionHistoryTableProps {
  studentId: string;
  dateRange?: { start: Date; end: Date };
}

export function SessionHistoryTable({ studentId, dateRange }: SessionHistoryTableProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [studentId, dateRange]);

  const fetchSessions = async () => {
    try {
      let query = supabase
        .from('learning_sessions')
        .select('*')
        .eq('student_id', studentId)
        .order('session_start', { ascending: false })
        .limit(100);

      if (dateRange) {
        query = query
          .gte('session_start', dateRange.start.toISOString())
          .lte('session_start', dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group sessions into 25-minute Pomodoro blocks
      // Sessions within 5 minutes of each other are considered part of the same block
      const pomodoroBlocks: any[] = [];
      
      (data || []).forEach(session => {
        const totalTime = session.total_active_seconds + session.total_idle_seconds + session.total_away_seconds;
        if (totalTime < 30) return; // Skip very short sessions

        const sessionStart = new Date(session.session_start).getTime();
        
        // Try to find an existing block within 5 minutes
        const existingBlock = pomodoroBlocks.find(block => {
          const blockEnd = new Date(block.session_start).getTime() + (block.total_duration_seconds * 1000);
          const timeSinceBlockEnd = (sessionStart - blockEnd) / 1000; // seconds
          
          // Merge if this session starts within 5 minutes of the previous block ending
          return timeSinceBlockEnd >= 0 && timeSinceBlockEnd <= 300; // 5 minutes
        });

        if (existingBlock && existingBlock.total_duration_seconds < 1500) { // Don't exceed 25 minutes per block
          // Merge into existing block
          existingBlock.total_active_seconds += session.total_active_seconds;
          existingBlock.total_idle_seconds += session.total_idle_seconds;
          existingBlock.total_away_seconds += session.total_away_seconds;
          existingBlock.total_duration_seconds = existingBlock.total_active_seconds + 
                                                 existingBlock.total_idle_seconds + 
                                                 existingBlock.total_away_seconds;
          existingBlock.session_count = (existingBlock.session_count || 1) + 1;
        } else {
          // Create new block
          pomodoroBlocks.push({
            id: session.id,
            session_start: session.session_start,
            total_active_seconds: session.total_active_seconds,
            total_idle_seconds: session.total_idle_seconds,
            total_away_seconds: session.total_away_seconds,
            total_duration_seconds: totalTime,
            session_count: 1
          });
        }
      });
      
      setSessions(pomodoroBlocks.slice(0, 20));
    } catch (error) {
      console.error('Error fetching sessions:', error);
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

  // Group sessions by date
  const groupedSessions: Record<string, any[]> = sessions.reduce((acc, session) => {
    const date = format(new Date(session.session_start), 'MMM d, yyyy');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, any[]>);

  interface PomodoroBarProps {
    activeSeconds: number;
    idleSeconds: number;
    awaySeconds: number;
    totalSeconds: number;
  }

  const PomodoroBar = ({ activeSeconds, idleSeconds, awaySeconds, totalSeconds }: PomodoroBarProps) => {
    const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds
    
    if (totalSeconds === 0) return null;

    // Calculate percentages out of 25 minutes (not out of total time)
    const activePercent = (activeSeconds / POMODORO_DURATION) * 100;
    const idlePercent = (idleSeconds / POMODORO_DURATION) * 100;
    const awayPercent = (awaySeconds / POMODORO_DURATION) * 100;
    const usedPercent = (totalSeconds / POMODORO_DURATION) * 100;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative flex h-6 w-full rounded-md overflow-hidden border border-border cursor-help bg-muted/30">
              {/* Active time */}
              {activePercent > 0 && (
                <div 
                  className="bg-success transition-all" 
                  style={{ width: `${activePercent}%` }}
                />
              )}
              {/* Idle time */}
              {idlePercent > 0 && (
                <div 
                  className="bg-warning transition-all" 
                  style={{ width: `${idlePercent}%` }}
                />
              )}
              {/* Away time */}
              {awayPercent > 0 && (
                <div 
                  className="bg-destructive transition-all" 
                  style={{ width: `${awayPercent}%` }}
                />
              )}
              {/* Remaining time (unfilled) is shown by the bg-muted/30 background */}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
              <div className="font-semibold mb-2">
                {formatTime(totalSeconds)} of 25-minute block
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-success" />
                <span>Active: {formatTime(activeSeconds)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-warning" />
                <span>Idle: {formatTime(idleSeconds)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-destructive" />
                <span>Away: {formatTime(awaySeconds)}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                <div className="w-3 h-3 rounded bg-muted" />
                <span>Unused: {formatTime(POMODORO_DURATION - totalSeconds)}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session History</CardTitle>
        <CardDescription>25-minute learning blocks with activity breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sessions found
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([date, dateSessions]) => (
              <div key={date} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">
                  {date}
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Start Time</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead className="w-20 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dateSessions.map((session) => {
                      return (
                        <TableRow key={session.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(session.session_start), 'h:mm a')}
                          </TableCell>
                          <TableCell>
                            <PomodoroBar 
                              activeSeconds={session.total_active_seconds}
                              idleSeconds={session.total_idle_seconds}
                              awaySeconds={session.total_away_seconds}
                              totalSeconds={session.total_duration_seconds}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatTime(session.total_duration_seconds)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
