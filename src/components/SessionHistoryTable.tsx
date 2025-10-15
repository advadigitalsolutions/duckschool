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
        .limit(50); // Fetch more to detect duplicates

      if (dateRange) {
        query = query
          .gte('session_start', dateRange.start.toISOString())
          .lte('session_start', dateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Deduplicate sessions - sessions within 5 seconds of each other are considered duplicates
      const deduped: any[] = [];
      const seen = new Set<string>();
      
      (data || []).forEach(session => {
        const startTime = new Date(session.session_start).getTime();
        const key = Math.floor(startTime / 5000); // Group by 5-second windows
        
        if (!seen.has(key.toString())) {
          seen.add(key.toString());
          deduped.push(session);
        } else {
          // Found a duplicate - merge times into the first one
          const existing = deduped.find(s => {
            const existingTime = new Date(s.session_start).getTime();
            return Math.floor(existingTime / 5000) === key;
          });
          
          if (existing) {
            existing.total_active_seconds += session.total_active_seconds;
            existing.total_idle_seconds += session.total_idle_seconds;
            existing.total_away_seconds += session.total_away_seconds;
            
            // Use the latest session_end if available
            if (session.session_end && (!existing.session_end || 
                new Date(session.session_end) > new Date(existing.session_end))) {
              existing.session_end = session.session_end;
            }
          }
        }
      });
      
      // Filter out zero-time and very short sessions
      const filtered = deduped.filter(session => {
        const totalTime = session.total_active_seconds + session.total_idle_seconds + session.total_away_seconds;
        return totalTime >= 30; // Only show sessions with at least 30 seconds
      });
      
      setSessions(filtered.slice(0, 20)); // Return top 20 after dedup and filter
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

  interface SegmentedBarProps {
    activeSeconds: number;
    idleSeconds: number;
    awaySeconds: number;
  }

  const SegmentedBar = ({ activeSeconds, idleSeconds, awaySeconds }: SegmentedBarProps) => {
    const total = activeSeconds + idleSeconds + awaySeconds;
    if (total === 0) return null;

    const activePercent = (activeSeconds / total) * 100;
    const idlePercent = (idleSeconds / total) * 100;
    const awayPercent = (awaySeconds / total) * 100;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-6 w-full rounded-md overflow-hidden border border-border cursor-help">
              {activePercent > 0 && (
                <div 
                  className="bg-success transition-all" 
                  style={{ width: `${activePercent}%` }}
                />
              )}
              {idlePercent > 0 && (
                <div 
                  className="bg-warning transition-all" 
                  style={{ width: `${idlePercent}%` }}
                />
              )}
              {awayPercent > 0 && (
                <div 
                  className="bg-destructive transition-all" 
                  style={{ width: `${awayPercent}%` }}
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm space-y-1">
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
        <CardDescription>Recent learning sessions</CardDescription>
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
                      const duration = session.total_active_seconds + session.total_idle_seconds + session.total_away_seconds;
                      return (
                        <TableRow key={session.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(session.session_start), 'h:mm a')}
                          </TableCell>
                          <TableCell>
                            <SegmentedBar 
                              activeSeconds={session.total_active_seconds}
                              idleSeconds={session.total_idle_seconds}
                              awaySeconds={session.total_away_seconds}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatTime(duration)}
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
