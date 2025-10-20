import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RewardsShop } from '@/components/RewardsShop';
import { FocusDuckCosmetics } from '@/components/FocusDuckCosmetics';
import { AnimatedXPCounter } from '@/components/AnimatedXPCounter';
import { Gift, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { useXP } from '@/hooks/useXP';

export default function StudentRewards() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { totalXP } = useXP(studentId || '');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentData) {
        setStudentId(studentData.id);

        // Fetch redemptions
        const { data: redemptionsData } = await supabase
          .from('reward_redemptions')
          .select('*, rewards(*)')
          .eq('student_id', studentData.id)
          .order('redeemed_at', { ascending: false });

        setRedemptions(redemptionsData || []);
      }
    } catch (error) {
      console.error('Error fetching rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Header with XP Display */}
      <div className="flex items-center justify-between gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <ShoppingBag className="h-8 w-8" />
            Rewards Shop
          </h1>
          <p className="text-muted-foreground">Spend your XP on amazing rewards!</p>
        </div>

        {/* Total XP Display with Animation */}
        <AnimatedXPCounter value={totalXP} />
      </div>

      {/* Rewards Shop */}
      <RewardsShop studentId={studentId || undefined} />

      {/* Focus Duck Cosmetics */}
      {studentId && <FocusDuckCosmetics studentId={studentId} />}

      {/* Redemption History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            My Redemptions
          </CardTitle>
          <CardDescription>Your reward redemption history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {redemptions.length > 0 ? (
              redemptions.map((redemption) => (
                <div key={redemption.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{redemption.rewards.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(redemption.redeemed_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{redemption.xp_cost} XP</p>
                    <p className={`text-xs ${
                      redemption.status === 'approved' ? 'text-success' :
                      redemption.status === 'denied' ? 'text-destructive' :
                      'text-warning'
                    }`}>
                      {redemption.status.charAt(0).toUpperCase() + redemption.status.slice(1)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No redemptions yet. Start shopping to see your history here!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
