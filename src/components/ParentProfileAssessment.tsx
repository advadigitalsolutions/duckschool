import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Sparkles, Brain, Heart, Users } from 'lucide-react';
import { psychologicalAssessmentQuestions, assessmentMetadata } from '@/utils/psychologicalAssessmentQuestions';
import { ImprovedPersonalityReport } from './ImprovedPersonalityReport';

interface ParentProfileAssessmentProps {
  onComplete?: () => void;
}

export function ParentProfileAssessment({ onComplete }: ParentProfileAssessmentProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [completed, setCompleted] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Auto-save draft answers whenever they change
  useEffect(() => {
    if (Object.keys(answers).length > 0 && profile) {
      const saveDraft = async () => {
        await supabase
          .from('profiles')
          .update({ assessment_answers_draft: answers })
          .eq('id', profile.id);
      };
      saveDraft();
    }
  }, [answers, profile]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    setProfile(data);
    setCompleted(data?.profile_assessment_completed || false);
    
    // Load draft answers if they exist
    if (data?.assessment_answers_draft && typeof data.assessment_answers_draft === 'object') {
      const draftAnswers = data.assessment_answers_draft as Record<string, string | string[]>;
      if (Object.keys(draftAnswers).length > 0) {
        setAnswers(draftAnswers);
        toast.info('Your previous answers have been restored');
      }
    }
  };

  const currentQuestion = psychologicalAssessmentQuestions[currentStep];
  const progress = ((currentStep + 1) / psychologicalAssessmentQuestions.length) * 100;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      toast.loading('Analyzing your responses and creating your personalized profile...');

      // Call AI to analyze responses
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-psychological-profile',
        {
          body: {
            responses: answers,
            studentName: profile?.name || 'Educator',
            gradeLevel: 'Educator' // Identify as educator/parent
          }
        }
      );

      if (analysisError) throw analysisError;

      // Update profile with analysis results
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          psychological_profile: analysisData.psychological_profile,
          learning_preferences: analysisData.learning_preferences,
          cognitive_traits: analysisData.cognitive_traits,
          profile_assessment_completed: true,
          assessment_answers_draft: null // Clear draft after completion
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.dismiss();
      toast.success('Profile complete! You can now see how to work best with your students.');
      
      // Refetch profile to get the updated data including psychological_profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (updatedProfile) {
          setProfile(updatedProfile);
          setCompleted(true);
        }
      }
      
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.dismiss();
      toast.error('Failed to complete assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, psychologicalAssessmentQuestions.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const isAnswered = () => {
    const answer = answers[currentQuestion.id];
    if (!answer) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'string') return answer.trim().length > 0;
    return false;
  };

  // Completed view with report
  if (completed && profile?.psychological_profile) {
    return (
      <div className="space-y-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Your Teaching & Learning Profile
            </CardTitle>
            <CardDescription>
              Understanding yourself helps create better learning partnerships with your students
            </CardDescription>
          </CardHeader>
        </Card>

        <ImprovedPersonalityReport
          student={{
            ...profile,
            display_name: profile.name,
            parent_id: null // Mark as educator view
          }}
          onRetake={async () => {
            await supabase
              .from('profiles')
              .update({
                profile_assessment_completed: false,
                assessment_answers_draft: {}
              })
              .eq('id', profile.id);
            setCompleted(false);
            setAnswers({});
            setCurrentStep(0);
            toast.info('Starting fresh assessment');
          }}
        />
      </div>
    );
  }

  // Assessment in progress
  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{assessmentMetadata.title}</CardTitle>
              <CardDescription className="text-base">
                {assessmentMetadata.description.replace('learner', 'educator/manager')}
              </CardDescription>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  {assessmentMetadata.totalQuestions} questions
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {assessmentMetadata.estimatedTime}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Question {currentStep + 1} of {psychologicalAssessmentQuestions.length}
          </span>
          <span className="font-medium">{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <Badge variant="outline" className="mb-2 capitalize">
              {currentQuestion.category.replace(/_/g, ' ')}
            </Badge>
            <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
            {currentQuestion.description && (
              <CardDescription className="text-base">
                {currentQuestion.description}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Single choice */}
          {currentQuestion.type === 'single' && (
            <RadioGroup
              value={answers[currentQuestion.id] as string}
              onValueChange={(value) => 
                setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
              }
            >
              {currentQuestion.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Multiple choice */}
          {currentQuestion.type === 'multiple' && (
            <div className="space-y-2">
              {currentQuestion.options?.map((option) => {
                const currentAnswers = (answers[currentQuestion.id] || []) as string[];
                return (
                  <div key={option} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                    <Checkbox
                      id={option}
                      checked={currentAnswers.includes(option)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAnswers(prev => ({
                            ...prev,
                            [currentQuestion.id]: [...currentAnswers, option]
                          }));
                        } else {
                          setAnswers(prev => ({
                            ...prev,
                            [currentQuestion.id]: currentAnswers.filter(a => a !== option)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={option} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                );
              })}
            </div>
          )}

          {/* Text input */}
          {currentQuestion.type === 'text' && (
            <Textarea
              value={(answers[currentQuestion.id] as string) || ''}
              onChange={(e) => 
                setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))
              }
              placeholder={currentQuestion.placeholder}
              rows={4}
              className="resize-none"
            />
          )}

          {/* Scale */}
          {currentQuestion.type === 'scale' && (
            <RadioGroup
              value={answers[currentQuestion.id] as string}
              onValueChange={(value) => 
                setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
              }
            >
              {currentQuestion.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1"
            >
              Previous
            </Button>
            {currentStep === psychologicalAssessmentQuestions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={!isAnswered() || loading}
                className="flex-1"
              >
                {loading ? 'Analyzing...' : 'Complete Assessment'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isAnswered()}
                className="flex-1"
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
