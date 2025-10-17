import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RewardsShop } from '@/components/RewardsShop';
import { FocusDuckCosmetics } from '@/components/FocusDuckCosmetics';
import { Gift, ShoppingBag, Coins } from 'lucide-react';
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
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <ShoppingBag className="h-8 w-8" />
          Rewards Shop
        </h1>
        <p className="text-muted-foreground">Spend your XP on amazing rewards!</p>
      </div>

      {/* Total XP Display */}
      <div className="flex justify-end">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-1 shadow-2xl animate-pulse">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-6">
            {/* Metallic shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[slide-shine_3s_ease-in-out_infinite]" 
                 style={{
                   backgroundSize: '200% 100%',
                   animation: 'slide-shine 3s ease-in-out infinite'
                 }} 
            />
            
            <div className="relative flex items-center gap-4">
              <Coins className="h-10 w-10 text-amber-400 animate-bounce" />
              <div>
                <p className="text-sm font-medium text-amber-400/80 uppercase tracking-wider">Total XP</p>
                <p className="text-5xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                  {totalXP.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
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
