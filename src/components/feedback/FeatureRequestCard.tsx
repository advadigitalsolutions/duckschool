import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface FeatureRequestCardProps {
  request: any;
  onUpdate: () => void;
}

export function FeatureRequestCard({ request, onUpdate }: FeatureRequestCardProps) {
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadVoteData();
  }, [request.id]);

  const loadVoteData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's vote
    const { data: voteData } = await supabase
      .from('feature_request_votes')
      .select('vote_type')
      .eq('feature_request_id', request.id)
      .eq('user_id', user.id)
      .single();

    if (voteData) {
      setUserVote(voteData.vote_type as 'up' | 'down');
    }

    // Count votes
    const votes = request.feature_request_votes || [];
    setUpvotes(votes.filter((v: any) => v.vote_type === 'up').length);
    setDownvotes(votes.filter((v: any) => v.vote_type === 'down').length);
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (userVote === voteType) {
        // Remove vote
        await supabase
          .from('feature_request_votes')
          .delete()
          .eq('feature_request_id', request.id)
          .eq('user_id', user.id);
        setUserVote(null);
      } else {
        // Add or update vote
        await supabase
          .from('feature_request_votes')
          .upsert({
            feature_request_id: request.id,
            user_id: user.id,
            vote_type: voteType,
          });
        setUserVote(voteType);
      }

      onUpdate();
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to record vote',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'planned':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'under_review':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'declined':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold">{request.title}</h3>
              <Badge className={getStatusColor(request.status)}>
                {request.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{request.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 min-w-[80px]">
            <div className="flex items-center gap-1">
              <Button
                variant={userVote === 'up' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleVote('up')}
                className="h-8 w-8 p-0"
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[30px] text-center">
                {upvotes - downvotes}
              </span>
              <Button
                variant={userVote === 'down' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleVote('down')}
                className="h-8 w-8 p-0"
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}