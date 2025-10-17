import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Gift, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Reward {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  xp_cost: number;
  requires_approval: boolean;
  active: boolean;
}

export function RewardsManagement() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    emoji: '🎁',
    xp_cost: 100,
    requires_approval: false,
    active: true,
  });

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const setupStarterRewards = async () => {
    try {
      setSetupLoading(true);
      const { data, error } = await supabase.functions.invoke('setup-starter-rewards');

      if (error) throw error;

      toast.success('Starter rewards added!', {
        description: `Added ${data.count} starter rewards to get you started`,
      });

      fetchRewards();
    } catch (error) {
      console.error('Error setting up starter rewards:', error);
      toast.error('Failed to setup starter rewards');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingReward) {
        const { error } = await supabase
          .from('rewards')
          .update(formData)
          .eq('id', editingReward.id);

        if (error) throw error;
        toast.success('Reward updated!');
      } else {
        const { error } = await supabase
          .from('rewards')
          .insert({ ...formData, parent_id: user.id });

        if (error) throw error;
        toast.success('Reward created!');
      }

      setDialogOpen(false);
      resetForm();
      fetchRewards();
    } catch (error) {
      console.error('Error saving reward:', error);
      toast.error('Failed to save reward');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Reward deleted');
      fetchRewards();
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error('Failed to delete reward');
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      title: reward.title,
      description: reward.description || '',
      emoji: reward.emoji,
      xp_cost: reward.xp_cost,
      requires_approval: reward.requires_approval,
      active: reward.active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingReward(null);
    setFormData({
      title: '',
      description: '',
      emoji: '🎁',
      xp_cost: 100,
      requires_approval: false,
      active: true,
    });
  };

  const emojiOptions = ['🎁', '🏆', '⭐', '🎉', '🎮', '🍕', '🍦', '📚', '🎨', '🎵', '⚽', '🎯', '💎', '🔥', '✨'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Rewards Shop
            </CardTitle>
            <CardDescription>Create rewards students can redeem with their XP</CardDescription>
          </div>
          <div className="flex gap-2">
            {rewards.length === 0 && (
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={setupStarterRewards}
                disabled={setupLoading}
              >
                <Sparkles className="h-4 w-4" />
                Auto-Setup Starter Rewards
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Reward
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingReward ? 'Edit' : 'Create'} Reward</DialogTitle>
                <DialogDescription>
                  Add a reward that students can redeem with their XP
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="emoji">Emoji</Label>
                  <div className="flex gap-2 flex-wrap">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, emoji })}
                        className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                          formData.emoji === emoji
                            ? 'border-primary scale-110'
                            : 'border-transparent hover:border-muted-foreground'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Reward Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Extra 30 minutes screen time"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional details about this reward..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xp_cost">XP Cost</Label>
                  <Input
                    id="xp_cost"
                    type="number"
                    min="1"
                    value={formData.xp_cost}
                    onChange={(e) => setFormData({ ...formData, xp_cost: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="requires_approval">Requires Approval</Label>
                    <p className="text-xs text-muted-foreground">Student must request and wait for approval</p>
                  </div>
                  <Switch
                    id="requires_approval"
                    checked={formData.requires_approval}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_approval: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="active">Active</Label>
                    <p className="text-xs text-muted-foreground">Show in rewards shop</p>
                  </div>
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.title || formData.xp_cost < 1}>
                  {editingReward ? 'Update' : 'Create'} Reward
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No rewards yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create rewards that students can redeem with their XP
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rewards.map((reward) => (
              <div key={reward.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-3xl">{reward.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{reward.title}</h4>
                      {!reward.active && <Badge variant="secondary">Inactive</Badge>}
                      {reward.requires_approval && <Badge variant="outline">Requires Approval</Badge>}
                    </div>
                    {reward.description && (
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                    )}
                  </div>
                  <Badge className="shrink-0">{reward.xp_cost} XP</Badge>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(reward)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(reward.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
