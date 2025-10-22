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
import { Sparkles, Brain, Heart } from 'lucide-react';
import { psychologicalAssessmentQuestions, assessmentMetadata } from '@/utils/psychologicalAssessmentQuestions';
import { ImprovedPersonalityReport } from './ImprovedPersonalityReport';

interface ImprovedProfileAssessmentProps {
  studentId: string;
  onComplete: () => void;
}

export function ImprovedProfileAssessment({ studentId, onComplete }: ImprovedProfileAssessmentProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [completed, setCompleted] = useState(false);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  // Auto-save draft answers whenever they change
  useEffect(() => {
    if (Object.keys(answers).length > 0 && studentId) {
      const saveDraft = async () => {
        await supabase
          .from('students')
          .update({ assessment_answers_draft: answers })
          .eq('id', studentId);
      };
      saveDraft();
    }
  }, [answers, studentId]);

  const fetchStudent = async () => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    
    setStudent(data);
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
            studentName: student?.name || 'Student',
            gradeLevel: student?.grade_level || 'Unknown'
          }
        }
      );

      if (analysisError) throw analysisError;

      // Update student record with comprehensive profile
      const { error: updateError } = await supabase
        .from('students')
        .update({
          personality_type: analysisData.personality_type,
          psychological_profile: analysisData.psychological_profile,
          learning_preferences: analysisData.learning_preferences,
          cognitive_traits: analysisData.cognitive_traits,
          learning_profile: {
            responses: answers,
            analysis: analysisData,
            completedAt: new Date().toISOString()
          },
          profile_assessment_completed: true,
          assessment_answers_draft: {} // Clear draft after completion
        })
        .eq('id', studentId);

      if (updateError) throw updateError;

      toast.dismiss();
      toast.success('Profile complete! Your learning experience is now personalized.', {
        description: 'The system will adapt to your unique learning style.',
        duration: 5000
      });
      
      await fetchStudent();
      setCompleted(true);
      onComplete();
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      toast.dismiss();
      toast.error('Failed to complete assessment', {
        description: error.message || 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  if (completed && student?.psychological_profile) {
    return (
      <ImprovedPersonalityReport
        student={student}
        onRetake={async () => {
          setLoading(true);
          try {
            const { error } = await supabase
              .from('students')
              .update({ 
                profile_assessment_completed: false,
                assessment_answers_draft: {} // Clear draft when retaking
              })
              .eq('id', studentId);

            if (error) throw error;

            setCompleted(false);
            setAnswers({});
            setCurrentStep(0);
            await fetchStudent();
            toast.success('Ready to retake assessment!');
          } catch (error: any) {
            console.error('Error resetting assessment:', error);
            toast.error('Failed to reset assessment');
          } finally {
            setLoading(false);
          }
        }}
      />
    );
  }

  const handleNext = () => {
    if (currentStep < psychologicalAssessmentQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isAnswered = () => {
    const answer = answers[currentQuestion.id];
    if (!answer) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'string') return answer.trim().length > 0;
    return false;
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          {assessmentMetadata.title}
        </CardTitle>
        <CardDescription>
          <div className="flex items-start gap-2">
            <Heart className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
            <span>{assessmentMetadata.description}</span>
          </div>
          <div className="mt-2 text-xs">
            Question {currentStep + 1} of {assessmentMetadata.totalQuestions} • {assessmentMetadata.estimatedTime}
          </div>
        </CardDescription>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">{currentQuestion.question}</Label>
              {currentQuestion.description && (
                <p className="text-sm text-muted-foreground mt-1">{currentQuestion.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2 capitalize">
                {currentQuestion.category.replace(/_/g, ' ')}
              </p>
            </div>

            {/* Single choice */}
            {currentQuestion.type === 'single' && (
              <RadioGroup
                value={answers[currentQuestion.id] as string || ''}
                onValueChange={(value) => setAnswers({ ...answers, [currentQuestion.id]: value })}
              >
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value={option} id={`${currentQuestion.id}-${index}`} className="mt-1" />
                    <Label htmlFor={`${currentQuestion.id}-${index}`} className="cursor-pointer flex-1 font-normal">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Multiple choice */}
            {currentQuestion.type === 'multiple' && (
              <div className="space-y-2">
                {currentQuestion.options?.map((option, index) => {
                  const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
                  return (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                      <Checkbox
                        id={`${currentQuestion.id}-${index}`}
                        checked={currentAnswers.includes(option)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAnswers({
                              ...answers,
                              [currentQuestion.id]: [...currentAnswers, option]
                            });
                          } else {
                            setAnswers({
                              ...answers,
                              [currentQuestion.id]: currentAnswers.filter(a => a !== option)
                            });
                          }
                        }}
                        className="mt-1"
                      />
                      <Label htmlFor={`${currentQuestion.id}-${index}`} className="cursor-pointer flex-1 font-normal">
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex-1"
            >
              Previous
            </Button>
            <Button
              type="submit"
              disabled={!isAnswered() || loading}
              className="flex-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Analyzing...
                </span>
              ) : currentStep === psychologicalAssessmentQuestions.length - 1 ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Complete Assessment
                </span>
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
