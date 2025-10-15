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
    if (!studentId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('learning_sessions')
        .select('*')
        .eq('student_id', studentId)
        .not('pomodoro_block_start', 'is', null)
        .order('pomodoro_block_start', { ascending: false })
        .limit(50);

      if (dateRange) {
        query = query
          .gte('pomodoro_block_start', dateRange.start.toISOString())
          .lte('pomodoro_block_start', dateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      setSessions(data || []);
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

  // Group sessions by date (filter out sessions without pomodoro_block_start)
  const groupedSessions: Record<string, any[]> = sessions
    .filter(session => session.pomodoro_block_start != null)
    .reduce((acc, session) => {
      const date = format(new Date(session.pomodoro_block_start), 'MMM d, yyyy');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(session);
      return acc;
    }, {} as Record<string, any[]>);

  interface PomodoroBarProps {
    session: any;
  }

  const PomodoroBar = ({ session }: PomodoroBarProps) => {
    const activeSeconds = session.total_active_seconds || 0;
    const idleSeconds = session.total_idle_seconds || 0;
    const awaySeconds = session.total_away_seconds || 0;
    const totalSeconds = activeSeconds + idleSeconds + awaySeconds;
    const isComplete = session.is_block_complete;
    
    const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds
    
    if (totalSeconds === 0) return null;

    // Calculate percentages out of 25 minutes (not out of total time)
    const activePercent = (activeSeconds / POMODORO_DURATION) * 100;
    const idlePercent = (idleSeconds / POMODORO_DURATION) * 100;
    const awayPercent = (awaySeconds / POMODORO_DURATION) * 100;
    const usedPercent = (totalSeconds / POMODORO_DURATION) * 100;

    // Pastel color palette from the provided image
    const activeColor = '#00CC6C'; // Dark Pastel Green
    const idleColor = '#EEBAB2';   // Soft peachy pink (idle/pause)
    const awayColor = '#FF8F57';   // Mango Tango (bright orange for away)
    const unusedColor = '#FEF5E7'; // Eggwhite

    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="relative flex h-6 flex-1 rounded-md overflow-hidden border border-border cursor-help"
                style={{ backgroundColor: unusedColor }}
              >
                {/* Active time */}
                {activePercent > 0 && (
                  <div 
                    className="transition-all" 
                    style={{ 
                      width: `${activePercent}%`,
                      backgroundColor: activeColor
                    }}
                  />
                )}
                {/* Idle time */}
                {idlePercent > 0 && (
                  <div 
                    className="transition-all" 
                    style={{ 
                      width: `${idlePercent}%`,
                      backgroundColor: idleColor
                    }}
                  />
                )}
                {/* Away time */}
                {awayPercent > 0 && (
                  <div 
                    className="transition-all" 
                    style={{ 
                      width: `${awayPercent}%`,
                      backgroundColor: awayColor
                    }}
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm space-y-1">
                <div className="font-semibold mb-2">
                  {formatTime(totalSeconds)} of 25-minute block
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: activeColor }} />
                  <span>Active: {formatTime(activeSeconds)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: idleColor }} />
                  <span>Idle: {formatTime(idleSeconds)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: awayColor }} />
                  <span>Away: {formatTime(awaySeconds)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: unusedColor }} />
                  <span>Unused: {formatTime(POMODORO_DURATION - totalSeconds)}</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
          {isComplete && (
            <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded whitespace-nowrap">✓ Complete</span>
          )}
        </div>
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
                      const totalTime = (session.total_active_seconds || 0) + 
                                       (session.total_idle_seconds || 0) + 
                                       (session.total_away_seconds || 0);
                      return (
                        <TableRow key={session.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(session.pomodoro_block_start), 'h:mm a')}
                          </TableCell>
                          <TableCell>
                            <PomodoroBar session={session} />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatTime(totalTime)}
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
