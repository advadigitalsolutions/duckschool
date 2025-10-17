import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FocusDuckCosmeticsProps {
  studentId: string;
}

export function FocusDuckCosmetics({ studentId }: FocusDuckCosmeticsProps) {
  const [ownedCosmetics, setOwnedCosmetics] = useState<string[]>([]);
  const [activeCosmetics, setActiveCosmetics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCosmetics();
  }, [studentId]);

  const fetchCosmetics = async () => {
    try {
      // Get redeemed cosmetic rewards
      const { data: redemptions } = await supabase
        .from('reward_redemptions')
        .select(`
          id,
          status,
          reward:rewards (
            metadata
          )
        `)
        .eq('student_id', studentId)
        .eq('status', 'approved')
        .not('reward', 'is', null);

      const cosmetics = (redemptions || [])
        .filter((r: any) => r.reward?.metadata?.type === 'focus_duck_cosmetic')
        .map((r: any) => r.reward.metadata.cosmetic_id);

      setOwnedCosmetics(cosmetics);

      // Load active cosmetics from student settings
      const { data: student } = await supabase
        .from('students')
        .select('focus_duck_cosmetics')
        .eq('id', studentId)
        .single();

      if (student?.focus_duck_cosmetics && Array.isArray(student.focus_duck_cosmetics)) {
        setActiveCosmetics(student.focus_duck_cosmetics as string[]);
      }
    } catch (error) {
      console.error('Error fetching cosmetics:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCosmetic = async (cosmeticId: string, enabled: boolean) => {
    try {
      const newActive = enabled
        ? [...activeCosmetics, cosmeticId]
        : activeCosmetics.filter(id => id !== cosmeticId);

      const { error } = await supabase
        .from('students')
        .update({ focus_duck_cosmetics: newActive })
        .eq('id', studentId);

      if (error) throw error;

      setActiveCosmetics(newActive);
      toast.success(enabled ? 'Cosmetic equipped!' : 'Cosmetic removed');
    } catch (error) {
      console.error('Error toggling cosmetic:', error);
      toast.error('Failed to update cosmetic');
    }
  };

  if (loading || ownedCosmetics.length === 0) {
    return null;
  }

  const cosmeticInfo: Record<string, { name: string; emoji: string; description: string }> = {
    beret: {
      name: 'Tiny Red Beret',
      emoji: '🎩',
      description: 'A sophisticated French beret for your Focus Duck'
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🦆 Focus Duck Cosmetics
        </CardTitle>
        <CardDescription>
          Toggle your unlocked cosmetics on and off
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ownedCosmetics.map((cosmeticId) => {
          const info = cosmeticInfo[cosmeticId];
          if (!info) return null;

          const isActive = activeCosmetics.includes(cosmeticId);

          return (
            <div
              key={cosmeticId}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{info.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{info.name}</h4>
                    <Badge variant={isActive ? 'default' : 'outline'}>
                      {isActive ? 'Equipped' : 'Owned'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`cosmetic-${cosmeticId}`} className="text-sm">
                  {isActive ? 'On' : 'Off'}
                </Label>
                <Switch
                  id={`cosmetic-${cosmeticId}`}
                  checked={isActive}
                  onCheckedChange={(checked) => toggleCosmetic(cosmeticId, checked)}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
