import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useXP } from '@/hooks/useXP';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Reward {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  xp_cost: number;
  requires_approval: boolean;
}

interface Redemption {
  id: string;
  reward_id: string;
  xp_cost: number;
  status: string;
  requested_at: string;
  rewards: Reward;
}

interface RewardsShopProps {
  studentId: string;
}

export function RewardsShop({ studentId }: RewardsShopProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { availableXP, refreshXP } = useXP(studentId);

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      // Fetch active rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('active', true)
        .order('xp_cost');

      if (rewardsError) throw rewardsError;
      setRewards(rewardsData || []);

      // Fetch student's redemptions
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from('reward_redemptions')
        .select('*, rewards(*)')
        .eq('student_id', studentId)
        .order('requested_at', { ascending: false });

      if (redemptionsError) throw redemptionsError;
      setRedemptions(redemptionsData || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!selectedReward) return;

    try {
      // Play cha-ching sound
      const audio = new Audio('/sounds/xp-cha-ching.mp3');
      audio.volume = 0.5;
      audio.play().catch(console.error);

      // Play countdown ticker sound
      const tickerAudio = new Audio('/sounds/xp-countdown.mp3');
      tickerAudio.volume = 0.3;
      tickerAudio.play().catch(console.error);

      const { error } = await supabase
        .from('reward_redemptions')
        .insert({
          student_id: studentId,
          reward_id: selectedReward.id,
          xp_cost: selectedReward.xp_cost,
          status: selectedReward.requires_approval ? 'pending' : 'completed',
        });

      if (error) throw error;

      // Deduct XP
      await supabase
        .from('xp_events')
        .insert({
          student_id: studentId,
          amount: -selectedReward.xp_cost,
          event_type: 'redemption',
          description: `Redeemed: ${selectedReward.title}`,
          reference_id: selectedReward.id,
        });

      toast.success(
        selectedReward.requires_approval
          ? 'Reward requested! Waiting for approval.'
          : 'Reward redeemed successfully!'
      );

      setConfirmOpen(false);
      setSelectedReward(null);
      fetchData();
      refreshXP();
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error('Failed to redeem reward');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'approved':
      case 'completed':
        return (
          <Badge className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Denied
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Rewards Shop
          </CardTitle>
          <CardDescription>
            Redeem your XP for rewards! You have {availableXP} XP available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Available Rewards */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Available Rewards</h3>
            {rewards.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No rewards available yet</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {rewards.map((reward) => {
                  const canAfford = availableXP >= reward.xp_cost;
                  return (
                    <div
                      key={reward.id}
                      className={`p-4 border rounded-lg transition-all ${
                        canAfford ? 'hover:border-primary hover:shadow-md' : 'opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{reward.emoji}</span>
                          <div>
                            <h4 className="font-medium">{reward.title}</h4>
                            {reward.description && (
                              <p className="text-sm text-muted-foreground">{reward.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant={canAfford ? 'default' : 'secondary'}>
                          {reward.xp_cost} XP
                        </Badge>
                        <Button
                          size="sm"
                          disabled={!canAfford}
                          onClick={() => {
                            setSelectedReward(reward);
                            setConfirmOpen(true);
                          }}
                          className="gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Redeem
                        </Button>
                      </div>
                      {reward.requires_approval && (
                        <p className="text-xs text-muted-foreground mt-2">Requires approval</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Redemption History */}
          {redemptions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">My Redemptions</h3>
              <div className="space-y-2">
                {redemptions.slice(0, 5).map((redemption) => (
                  <div
                    key={redemption.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{redemption.rewards.emoji}</span>
                      <div>
                        <p className="font-medium text-sm">{redemption.rewards.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(redemption.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{redemption.xp_cost} XP</Badge>
                      {getStatusBadge(redemption.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Redemption</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedReward && (
                <>
                  Are you sure you want to redeem <strong>{selectedReward.title}</strong> for{' '}
                  <strong>{selectedReward.xp_cost} XP</strong>?
                  {selectedReward.requires_approval && (
                    <p className="mt-2 text-amber-600">
                      This reward requires approval. Your request will be sent to your teacher.
                    </p>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRedeem}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
