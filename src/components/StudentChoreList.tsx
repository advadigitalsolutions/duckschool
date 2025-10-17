import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Trophy, Flame, Target, Sparkles } from 'lucide-react';
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

  const totalXPAvailable = todaysChores.reduce((sum, a) => sum + (a.chores?.xp_reward || 0), 0);
  const completedToday = completedChores.filter(
    (a) => a.completed_at && isToday(new Date(a.completed_at))
  );
  const xpEarnedToday = completedToday.reduce((sum, a) => sum + (a.xp_awarded || 0), 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                My Chores
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Sparkles className="h-4 w-4" />
                Complete chores to level up and earn rewards
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Today's Tasks</p>
                  <p className="text-3xl font-bold">{todaysChores.length}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">XP Available</p>
                  <p className="text-3xl font-bold text-primary">{totalXPAvailable}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </div>

            <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Earned Today</p>
                  <p className="text-3xl font-bold text-green-500">{xpEarnedToday}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Flame className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {todaysChores.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Today's Chores</h2>
          </div>
          <div className="space-y-3">
            {todaysChores.map((assignment, index) => (
              <div 
                key={assignment.id} 
                className="group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ChoreCard
                  title={assignment.chores?.title || ''}
                  description={assignment.chores?.description}
                  xpReward={assignment.chores?.xp_reward || 0}
                  priority={assignment.chores?.priority || 'medium'}
                  dueDate={assignment.due_date}
                  status={assignment.status}
                  onComplete={() => handleCompleteClick(assignment)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingChores.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Upcoming Chores</h2>
          </div>
          <div className="space-y-3">
            {upcomingChores.map((assignment, index) => (
              <div 
                key={assignment.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ChoreCard
                  title={assignment.chores?.title || ''}
                  description={assignment.chores?.description}
                  xpReward={assignment.chores?.xp_reward || 0}
                  priority={assignment.chores?.priority || 'medium'}
                  dueDate={assignment.due_date}
                  status={assignment.status}
                  onComplete={() => handleCompleteClick(assignment)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {completedChores.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold">Completed Chores</h2>
          </div>
          <div className="space-y-3">
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
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Trophy className="h-12 w-12 text-primary/50" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Chores Yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            You're all caught up! Check back later for new tasks and opportunities to earn XP.
          </p>
        </div>
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
