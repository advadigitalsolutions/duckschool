import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Users, Heart, Brain, Lightbulb, Target, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RelationshipAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
}

export function RelationshipAnalysisDialog({
  open,
  onOpenChange,
  student,
}: RelationshipAnalysisDialogProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [otherParty, setOtherParty] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [missingProfile, setMissingProfile] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if current user is student or educator
      const { data: studentData } = await supabase
        .from('students')
        .select('*, psychological_profile')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentData) {
        // Current user is a student, load their educator
        setCurrentUser(studentData);
        
        const { data: educatorProfile } = await supabase
          .from('profiles')
          .select('*, psychological_profile')
          .eq('id', studentData.parent_id)
          .single();

        setOtherParty(educatorProfile);

        if (!educatorProfile?.psychological_profile) {
          setMissingProfile('educator');
          return;
        }

        if (!studentData?.psychological_profile) {
          setMissingProfile('student');
          return;
        }

        // Both have profiles, generate analysis
        await generateAnalysis(studentData, educatorProfile, 'student');
      } else {
        // Current user is an educator, student is passed as prop
        const { data: educatorProfile } = await supabase
          .from('profiles')
          .select('*, psychological_profile')
          .eq('id', user.id)
          .single();

        setCurrentUser(educatorProfile);
        setOtherParty(student);

        if (!educatorProfile?.psychological_profile) {
          setMissingProfile('educator');
          return;
        }

        if (!student?.psychological_profile) {
          setMissingProfile('student');
          return;
        }

        // Both have profiles, generate analysis
        await generateAnalysis(student, educatorProfile, 'educator');
      }
    } catch (error) {
      console.error('Error loading relationship data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async (
    studentProfile: any,
    educatorProfile: any,
    viewerRole: 'student' | 'educator'
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-relationship', {
        body: {
          studentProfile: {
            name: studentProfile.name,
            psychological_profile: studentProfile.psychological_profile,
            learning_preferences: studentProfile.learning_preferences,
            cognitive_traits: studentProfile.cognitive_traits,
          },
          educatorProfile: {
            name: educatorProfile.name,
            psychological_profile: educatorProfile.psychological_profile,
            learning_preferences: educatorProfile.learning_preferences,
            cognitive_traits: educatorProfile.cognitive_traits,
          },
          viewerRole,
        },
      });

      if (error) throw error;
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error generating analysis:', error);
      toast.error('Failed to generate relationship analysis');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-primary" />
            Working Together Successfully
          </DialogTitle>
          <DialogDescription>
            Personalized insights for building a strong learning partnership
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {missingProfile && !loading && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium text-amber-900">
                    {missingProfile === 'educator' 
                      ? 'Your educator hasn\'t completed their learning profile yet'
                      : 'This student hasn\'t completed their learning profile yet'}
                  </p>
                  <p className="text-sm text-amber-800">
                    Once both you and your {missingProfile === 'educator' ? 'educator' : 'student'} have 
                    completed the learning profile assessment, you'll be able to see personalized insights 
                    about how to work together most effectively.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {analysis && !loading && (
          <div className="space-y-4">
            {/* Overview */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Your Partnership Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{analysis.overview}</p>
              </CardContent>
            </Card>

            {/* Communication Strategies */}
            {analysis.communication_strategies && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    How to Communicate Effectively
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.communication_strategies.map((strategy: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">→</span>
                        <span className="text-muted-foreground">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Learning Approach */}
            {analysis.learning_approach && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    Optimal Learning Approach
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.learning_approach.map((approach: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">✓</span>
                        <span className="text-muted-foreground">{approach}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Potential Challenges */}
            {analysis.potential_challenges && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    Things to Watch For
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.potential_challenges.map((challenge: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-amber-500 mt-1">⚠</span>
                        <span className="text-muted-foreground">{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Strengths of Partnership */}
            {analysis.partnership_strengths && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Your Shared Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.partnership_strengths.map((strength: string, index: number) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Steps */}
            {analysis.action_steps && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Your Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysis.action_steps.map((step: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                        <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
