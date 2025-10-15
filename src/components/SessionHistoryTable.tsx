import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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
      
      setSessions(deduped.slice(0, 20)); // Return top 20 after dedup
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

  const getStatusBadge = (session: any) => {
    if (!session.session_end) {
      // Check if session is stale (started more than 2 hours ago with no end)
      const startTime = new Date(session.session_start).getTime();
      const now = Date.now();
      const hoursAgo = (now - startTime) / (1000 * 60 * 60);
      
      if (hoursAgo > 2) {
        return <Badge variant="outline">Abandoned</Badge>;
      }
      return <Badge>In Progress</Badge>;
    }
    return <Badge variant="secondary">Completed</Badge>;
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Idle</TableHead>
                  <TableHead>Away</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const duration = session.total_active_seconds + session.total_idle_seconds + session.total_away_seconds;
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        {format(new Date(session.session_start), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(session.session_start), 'h:mm a')}
                      </TableCell>
                      <TableCell>{formatTime(duration)}</TableCell>
                      <TableCell className="text-success font-medium">
                        {formatTime(session.total_active_seconds)}
                      </TableCell>
                      <TableCell className="text-warning">
                        {formatTime(session.total_idle_seconds)}
                      </TableCell>
                      <TableCell className="text-destructive">
                        {formatTime(session.total_away_seconds)}
                      </TableCell>
                      <TableCell>{getStatusBadge(session)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
