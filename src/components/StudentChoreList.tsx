import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';
import { useChoreAssignments } from '@/hooks/useChores';
import { ChoreCard } from './ChoreCard';
import { format, isToday } from 'date-fns';

export function StudentChoreList() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { assignments, loading, completeChore, refreshAssignments } = useChoreAssignments(studentId || undefined);

  useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching student:', error);
      return;
    }
    setStudentId(data.id);
  };

  const handleCompleteClick = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsDialogOpen(true);
  };

  const handleComplete = async () => {
    if (!selectedAssignment) return;
    await completeChore(selectedAssignment.id, notes);
    setNotes('');
    setIsDialogOpen(false);
    setSelectedAssignment(null);
  };

  const todaysChores = assignments.filter(
    (a) => a.status === 'pending' && a.assigned_date && isToday(new Date(a.assigned_date))
  );

  const upcomingChores = assignments.filter(
    (a) => a.status === 'pending' && a.assigned_date && !isToday(new Date(a.assigned_date))
  );

  const completedChores = assignments.filter(
    (a) => a.status === 'completed' || a.status === 'verified'
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">My Chores</h2>
        <p className="text-muted-foreground">Complete chores to earn XP</p>
      </div>

      {todaysChores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Chores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysChores.map((assignment) => (
              <div key={assignment.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <ChoreCard
                    title={assignment.chores?.title || ''}
                    description={assignment.chores?.description}
                    xpReward={assignment.chores?.xp_reward || 0}
                    priority={assignment.chores?.priority || 'medium'}
                    dueDate={assignment.due_date}
                    status={assignment.status}
                  />
                </div>
                {assignment.status === 'pending' && (
                  <Button
                    onClick={() => handleCompleteClick(assignment)}
                    size="sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {upcomingChores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Chores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingChores.map((assignment) => (
              <div key={assignment.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <ChoreCard
                    title={assignment.chores?.title || ''}
                    description={assignment.chores?.description}
                    xpReward={assignment.chores?.xp_reward || 0}
                    priority={assignment.chores?.priority || 'medium'}
                    dueDate={assignment.due_date}
                    status={assignment.status}
                  />
                </div>
                {assignment.status === 'pending' && (
                  <Button
                    onClick={() => handleCompleteClick(assignment)}
                    size="sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {completedChores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Chores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedChores.map((assignment) => (
              <ChoreCard
                key={assignment.id}
                title={assignment.chores?.title || ''}
                description={assignment.chores?.description}
                xpReward={assignment.chores?.xp_reward || 0}
                priority={assignment.chores?.priority || 'medium'}
                dueDate={assignment.due_date}
                status={assignment.status}
                completedAt={assignment.completed_at}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {assignments.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No chores assigned yet. Check back later!
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Chore</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about completing this chore..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleComplete}>
                Mark Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
