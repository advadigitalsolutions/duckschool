import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, Heart, Lightbulb, Target, Sparkles, TrendingUp, Users, Clock } from 'lucide-react';
import { MeyersBriggsGradientBar } from './MeyersBriggsGradientBar';
import { RelationshipAnalysisDialog } from './RelationshipAnalysisDialog';
import { useState } from 'react';

interface ImprovedPersonalityReportProps {
  student: any;
  onRetake: () => void;
}

export function ImprovedPersonalityReport({ student, onRetake }: ImprovedPersonalityReportProps) {
  const profile = student.psychological_profile;
  const preferences = student.learning_preferences;
  const traits = student.cognitive_traits;
  const analysis = student.learning_profile?.analysis;
  const [showRelationshipDialog, setShowRelationshipDialog] = useState(false);

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Not Available</CardTitle>
          <CardDescription>Please complete the assessment to see your profile</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Extract scores from the text strings in core_dimensions
  const extractScore = (text: string | number): number => {
    if (!text) {
      console.log('No text provided to extractScore');
      return 50;
    }
    if (typeof text === 'number') return text;
    const textStr = String(text);
    console.log('Extracting from:', textStr.substring(0, 100));
    const match = textStr.match(/Score:\s*(\d+)/);
    const score = match ? parseInt(match[1]) : 50;
    console.log('Extracted score:', score);
    return score;
  };

  console.log('Full profile:', profile);
  console.log('Core dimensions:', profile.core_dimensions);

  const extraversionScore = extractScore(profile.core_dimensions?.introversion_extraversion);
  const intuitionScore = extractScore(profile.core_dimensions?.sensing_intuition);
  const feelingScore = extractScore(profile.core_dimensions?.thinking_feeling);
  const perceivingScore = extractScore(profile.core_dimensions?.judging_perceiving);

  console.log('Final scores:', { extraversionScore, intuitionScore, feelingScore, perceivingScore });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                {student.personality_type}
              </CardTitle>
              <CardDescription className="text-base">
                Your Personalized Learning Profile
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onRetake}>
              Retake Assessment
            </Button>
          </div>
        </CardHeader>
        {analysis?.summary && (
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>
          </CardContent>
        )}
      </Card>

      {/* Personality Dimensions - Myers-Briggs Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Personality Core
          </CardTitle>
          <CardDescription>Understanding your fundamental Myers-Briggs dimensions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <MeyersBriggsGradientBar
            leftLabel="Introversion"
            rightLabel="Extraversion"
            percentage={extraversionScore}
            leftColor="hsl(var(--chart-1))"
            rightColor="hsl(var(--chart-2))"
          />
          <MeyersBriggsGradientBar
            leftLabel="Sensing"
            rightLabel="Intuition"
            percentage={intuitionScore}
            leftColor="hsl(var(--chart-3))"
            rightColor="hsl(var(--chart-4))"
          />
          <MeyersBriggsGradientBar
            leftLabel="Thinking"
            rightLabel="Feeling"
            percentage={feelingScore}
            leftColor="hsl(var(--chart-5))"
            rightColor="hsl(var(--primary))"
          />
          <MeyersBriggsGradientBar
            leftLabel="Judging"
            rightLabel="Perceiving"
            percentage={perceivingScore}
            leftColor="hsl(var(--secondary))"
            rightColor="hsl(var(--accent))"
          />
        </CardContent>
      </Card>

      {/* Cognitive Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Your Cognitive Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profile.cognitive_strengths?.map((strength: string, index: number) => (
              <Badge key={index} variant="secondary" className="px-3 py-1">
                {strength}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Psychology */}
      {profile.learning_psychology && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              How You Learn Best
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Attention Style</h4>
              <p className="text-sm text-muted-foreground">{profile.learning_psychology.attention_style}</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Processing Speed</h4>
              <p className="text-sm text-muted-foreground">{profile.learning_psychology.processing_speed}</p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Memory Type</h4>
              <p className="text-sm text-muted-foreground">{profile.learning_psychology.memory_type}</p>
            </div>
            {profile.learning_psychology.curiosity_drivers && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">What Sparks Your Interest</h4>
                  <ul className="space-y-1">
                    {profile.learning_psychology.curiosity_drivers.map((driver: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {driver}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Learning Preferences */}
      {preferences && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Learning Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preferences.primary_modalities && (
              <div>
                <h4 className="font-semibold mb-2">Primary Learning Modalities</h4>
                <div className="flex flex-wrap gap-2">
                  {preferences.primary_modalities.map((modality: string, index: number) => (
                    <Badge key={index} className="capitalize">
                      #{index + 1} {modality}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {preferences.ideal_environments && (
              <>
                <Separator />
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Social
                    </h4>
                    <p className="text-sm text-muted-foreground">{preferences.ideal_environments.social}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Temporal
                    </h4>
                    <p className="text-sm text-muted-foreground">{preferences.ideal_environments.temporal}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Physical Space</h4>
                    <p className="text-sm text-muted-foreground">{preferences.ideal_environments.physical}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Emotional Patterns */}
      {profile.emotional_patterns && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Emotional Patterns & Motivation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">What Energizes You</h4>
              <ul className="space-y-1">
                {profile.emotional_patterns.motivation_triggers?.map((trigger: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    {trigger}
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">How You Handle Stress</h4>
              <ul className="space-y-1">
                {profile.emotional_patterns.stress_responses?.map((response: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    {response}
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">What Makes You Feel Accomplished</h4>
              <ul className="space-y-1">
                {profile.emotional_patterns.reward_preferences?.map((reward: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">★</span>
                    {reward}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personalization Recommendations */}
      {analysis?.personalization_recommendations && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              How We'll Personalize Your Experience
            </CardTitle>
            <CardDescription>
              Based on your profile, here's how the system will adapt to support your learning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.personalization_recommendations.curriculum_adaptations && (
              <div>
                <h4 className="font-semibold mb-2">Curriculum Adaptations</h4>
                <ul className="space-y-2">
                  {analysis.personalization_recommendations.curriculum_adaptations.map((adaptation: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">→</span>
                      {adaptation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Separator />
            {analysis.personalization_recommendations.motivation_strategies && (
              <div>
                <h4 className="font-semibold mb-2">Motivation Strategies</h4>
                <ul className="space-y-2">
                  {analysis.personalization_recommendations.motivation_strategies.map((strategy: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">→</span>
                      {strategy}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Relationship Analysis CTA */}
      <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
        <CardContent className="pt-6 text-center">
          <Button 
            onClick={() => setShowRelationshipDialog(true)}
            size="lg"
            className="gap-2"
          >
            <Users className="h-5 w-5" />
            See how you and your {student.parent_id ? 'educator' : 'student'} work best together
          </Button>
        </CardContent>
      </Card>

      <RelationshipAnalysisDialog
        open={showRelationshipDialog}
        onOpenChange={setShowRelationshipDialog}
        student={student}
      />
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
