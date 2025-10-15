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
        .limit(20);

      if (dateRange) {
        query = query
          .gte('session_start', dateRange.start.toISOString())
          .lte('session_start', dateRange.end.toISOString());
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

  const getStatusBadge = (session: any) => {
    if (!session.session_end) {
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
