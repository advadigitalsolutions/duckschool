import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useChoreAssignments } from '@/hooks/useChores';

interface PendingAssignment {
  id: string;
  student_id: string;
  notes: string | null;
  photo_proof_url: string | null;
  completed_at: string;
  chores: {
    title: string;
    xp_reward: number;
  };
  students: {
    name: string;
  };
}

export function ChoreVerificationQueue() {
  const [parentId, setParentId] = useState<string | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const { verifyChore } = useChoreAssignments();

  useEffect(() => {
    fetchParent();
  }, []);

  useEffect(() => {
    if (parentId) {
      fetchPendingVerifications();
    }
  }, [parentId]);

  const fetchParent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setParentId(user.id);
    }
  };

  const fetchPendingVerifications = async () => {
    const { data, error } = await supabase
      .from('chore_assignments')
      .select(`
        *,
        chores!inner (
          title,
          xp_reward,
          parent_id
        ),
        students!inner (
          name
        )
      `)
      .eq('status', 'completed')
      .eq('chores.parent_id', parentId);

    if (error) {
      console.error('Error fetching pending verifications:', error);
      return;
    }

    setPendingAssignments(data || []);
  };

  const handleVerify = async (assignmentId: string, xpReward: number) => {
    if (!parentId) return;
    await verifyChore(assignmentId, xpReward, parentId);
    await fetchPendingVerifications();
  };

  if (pendingAssignments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pending Verifications</CardTitle>
          <Badge>{pendingAssignments.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingAssignments.map((assignment) => (
          <div key={assignment.id} className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{assignment.chores.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    by {assignment.students.name}
                  </p>
                </div>
                <Badge variant="secondary">
                  {assignment.chores.xp_reward} XP
                </Badge>
              </div>
              {assignment.notes && (
                <p className="text-sm text-muted-foreground">
                  Note: {assignment.notes}
                </p>
              )}
              {assignment.photo_proof_url && (
                <img
                  src={assignment.photo_proof_url}
                  alt="Proof"
                  className="max-w-xs rounded-lg"
                />
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleVerify(assignment.id, assignment.chores.xp_reward)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Verify
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
