import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bell, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Redemption {
  id: string;
  student_id: string;
  reward_id: string;
  xp_cost: number;
  status: string;
  requested_at: string;
  notes: string | null;
  students: {
    name: string;
    display_name: string | null;
  };
  rewards: {
    title: string;
    emoji: string;
    description: string | null;
  };
}

export function RedemptionApprovals() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [action, setAction] = useState<'approve' | 'deny'>('approve');

  useEffect(() => {
    fetchRedemptions();
    
    // Set up realtime subscription for new redemptions
    const channel = supabase
      .channel('redemption-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reward_redemptions'
        },
        () => {
          fetchRedemptions();
          toast('New reward redemption request!', {
            description: 'A student has requested a reward',
            icon: <Bell className="h-4 w-4" />,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRedemptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          students (name, display_name),
          rewards (title, emoji, description)
        `)
        .in('status', ['pending'])
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setRedemptions(data || []);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRedemption) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('reward_redemptions')
        .update({
          status: action === 'approve' ? 'approved' : 'denied',
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          notes,
        })
        .eq('id', selectedRedemption.id);

      if (error) throw error;

      toast.success(
        action === 'approve' 
          ? 'Reward redemption approved!' 
          : 'Reward redemption denied'
      );

      setDialogOpen(false);
      setSelectedRedemption(null);
      setNotes('');
      fetchRedemptions();
    } catch (error) {
      console.error('Error updating redemption:', error);
      toast.error('Failed to update redemption');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (redemptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Pending Approvals
          </CardTitle>
          <CardDescription>Review and approve student reward redemptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No pending approvals</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Pending Approvals
                {redemptions.length > 0 && (
                  <Badge className="ml-2">{redemptions.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>Review and approve student reward redemptions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {redemptions.map((redemption) => (
              <div
                key={redemption.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-3xl">{redemption.rewards.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{redemption.rewards.title}</h4>
                      <Badge variant="outline">{redemption.xp_cost} XP</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Requested by {redemption.students.display_name || redemption.students.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(redemption.requested_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setSelectedRedemption(redemption);
                      setAction('deny');
                      setDialogOpen(true);
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                    Deny
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setSelectedRedemption(redemption);
                      setAction('approve');
                      setDialogOpen(true);
                    }}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve' : 'Deny'} Reward Redemption
            </DialogTitle>
            <DialogDescription>
              {selectedRedemption && (
                <>
                  {action === 'approve' ? 'Approve' : 'Deny'} the redemption of{' '}
                  <strong>{selectedRedemption.rewards.title}</strong> for{' '}
                  <strong>
                    {selectedRedemption.students.display_name || selectedRedemption.students.name}
                  </strong>
                  ?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this decision..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              variant={action === 'approve' ? 'default' : 'destructive'}
            >
              {action === 'approve' ? 'Approve' : 'Deny'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
