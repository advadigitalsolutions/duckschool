import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ComingSoonProps {
  feature: string;
  description?: string;
}

export function ComingSoon({ feature, description }: ComingSoonProps) {
  const [voted, setVoted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUpvote = async () => {
    setIsAnimating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create or find the feature request for this coming soon feature
      const { data: existingRequest } = await supabase
        .from('feature_requests')
        .select('id')
        .eq('title', feature)
        .single();

      let requestId = existingRequest?.id;

      if (!requestId) {
        const { data: newRequest, error: createError } = await supabase
          .from('feature_requests')
          .insert({
            title: feature,
            description: description || `User requested: ${feature}`,
            status: 'submitted',
            created_by: user.id,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        requestId = newRequest.id;
      }

      // Add vote
      const { error: voteError } = await supabase
        .from('feature_request_votes')
        .upsert({
          feature_request_id: requestId,
          user_id: user.id,
          vote_type: 'up',
        });

      if (voteError && !voteError.message.includes('duplicate')) {
        throw voteError;
      }

      setVoted(true);
      toast({
        title: "Vote recorded!",
        description: "Thanks for helping us prioritize features.",
      });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to record vote. Please try again.",
        variant: "destructive",
      });
    }

    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="max-w-2xl w-full p-12 text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">{feature}</h2>
          <p className="text-xl text-muted-foreground">Coming Soon</p>
          {description && (
            <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-lg">
            Want this to exist sooner?{' '}
            <Button
              variant="ghost"
              className={`inline-flex items-center gap-2 text-lg font-semibold hover:scale-110 transition-transform ${
                isAnimating ? 'animate-bounce' : ''
              }`}
              onClick={handleUpvote}
              disabled={voted}
            >
              <ThumbsUp className={`h-5 w-5 ${voted ? 'fill-primary' : ''}`} />
              {voted ? 'Voted!' : 'Click here'}
            </Button>
            {' '}to upvote it in the{' '}
            <button
              onClick={() => navigate('/feature-requests')}
              className="text-primary font-semibold hover:underline underline-offset-4"
            >
              feature requests section
            </button>
            !
          </p>
        </div>

        {isAnimating && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <Sparkles
                key={i}
                className="absolute text-primary animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: '1s',
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}