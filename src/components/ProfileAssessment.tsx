import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { PersonalityReport } from './PersonalityReport';
import { assessmentQuestions, assessmentMetadata } from '@/utils/assessmentQuestions';

interface ProfileAssessmentProps {
  studentId: string;
  onComplete: () => void;
}

export function ProfileAssessment({ studentId, onComplete }: ProfileAssessmentProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  const fetchStudent = async () => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    
    setStudent(data);
    setCompleted(data?.profile_assessment_completed || false);
  };

  const currentQuestion = assessmentQuestions[currentStep];
  const progress = ((currentStep + 1) / assessmentQuestions.length) * 100;

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Analyze answers to build learning profile
      const learningProfile = {
        responses: answers,
        assessmentDate: new Date().toISOString(),
        categories: {} as Record<string, string[]>
      };

      // Group answers by category
      assessmentQuestions.forEach((q) => {
        if (answers[q.id]) {
          if (!learningProfile.categories[q.category]) {
            learningProfile.categories[q.category] = [];
          }
          learningProfile.categories[q.category].push(answers[q.id]);
        }
      });

      // Determine personality type based on responses
      const personalityType = determinePersonalityType(learningProfile.categories);

      const { error } = await supabase
        .from('students')
        .update({
          learning_profile: learningProfile,
          personality_type: personalityType,
          profile_assessment_completed: true
        })
        .eq('id', studentId);

      if (error) throw error;

      toast.success('Assessment completed! Your learning profile is ready.');
      await fetchStudent();
      setCompleted(true);
      onComplete();
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      toast.error('Failed to save assessment');
    } finally {
      setLoading(false);
    }
  };

  const determinePersonalityType = (categories: Record<string, string[]>): string => {
    // Enhanced personality type determination
    const learningStyles = categories.learning_style || [];
    const workStyles = categories.work_style || [];
    const studyHabits = categories.study_habits || [];
    
    // Count preferences for each learning modality
    const scores = {
      visual: 0,
      kinesthetic: 0,
      auditory: 0,
      readingWriting: 0
    };
    
    // Analyze learning style responses
    learningStyles.forEach(style => {
      if (style.toLowerCase().includes('video') || 
          style.toLowerCase().includes('watch') || 
          style.toLowerCase().includes('see') ||
          style.toLowerCase().includes('visual')) {
        scores.visual += 2;
      }
      if (style.toLowerCase().includes('hands-on') || 
          style.toLowerCase().includes('try') || 
          style.toLowerCase().includes('build') ||
          style.toLowerCase().includes('practice')) {
        scores.kinesthetic += 2;
      }
      if (style.toLowerCase().includes('discuss') || 
          style.toLowerCase().includes('listen') || 
          style.toLowerCase().includes('talk') ||
          style.toLowerCase().includes('hear')) {
        scores.auditory += 2;
      }
      if (style.toLowerCase().includes('read') || 
          style.toLowerCase().includes('write') || 
          style.toLowerCase().includes('text') ||
          style.toLowerCase().includes('notes')) {
        scores.readingWriting += 2;
      }
    });
    
    // Analyze work style preferences
    workStyles.forEach(style => {
      if (style.toLowerCase().includes('solo') || style.toLowerCase().includes('independent')) {
        scores.readingWriting += 1;
      }
      if (style.toLowerCase().includes('group') || style.toLowerCase().includes('discussion')) {
        scores.auditory += 1;
      }
    });
    
    // Analyze study habits
    studyHabits.forEach(habit => {
      if (habit.toLowerCase().includes('diagrams') || habit.toLowerCase().includes('charts')) {
        scores.visual += 1;
      }
      if (habit.toLowerCase().includes('practice') || habit.toLowerCase().includes('doing')) {
        scores.kinesthetic += 1;
      }
      if (habit.toLowerCase().includes('reading') || habit.toLowerCase().includes('writing')) {
        scores.readingWriting += 1;
      }
      if (habit.toLowerCase().includes('explaining') || habit.toLowerCase().includes('discussing')) {
        scores.auditory += 1;
      }
    });
    
    // Find the highest scoring modality
    const maxScore = Math.max(...Object.values(scores));
    const multipleMaxScores = Object.values(scores).filter(score => score === maxScore).length > 1;
    
    // If multiple modalities tied or all scores low, return Multimodal
    if (multipleMaxScores || maxScore < 2) {
      return 'Multimodal Learner';
    }
    
    // Return the highest scoring type
    if (scores.visual === maxScore) return 'Visual Learner';
    if (scores.kinesthetic === maxScore) return 'Kinesthetic Learner';
    if (scores.auditory === maxScore) return 'Auditory Learner';
    if (scores.readingWriting === maxScore) return 'Reading/Writing Learner';
    
    return 'Multimodal Learner';
  };

  if (completed && student) {
    return (
      <PersonalityReport
        student={student}
        onRetake={() => {
          setCompleted(false);
          setAnswers({});
          setCurrentStep(0);
          fetchStudent();
        }}
      />
    );
  }

  const handleNext = () => {
    if (currentStep < assessmentQuestions.length - 1) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {assessmentMetadata.title}
        </CardTitle>
        <CardDescription>
          Question {currentStep + 1} of {assessmentMetadata.totalQuestions}
        </CardDescription>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">{currentQuestion.question}</Label>
            <p className="text-xs text-muted-foreground">Category: {currentQuestion.category.replace(/_/g, ' ')}</p>
            
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => setAnswers({ ...answers, [currentQuestion.id]: value })}
            >
              {currentQuestion.options.map((option: string, index: number) => (
                <div key={index} className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <RadioGroupItem value={option} id={`${currentQuestion.id}-${index}`} className="mt-1" />
                  <Label htmlFor={`${currentQuestion.id}-${index}`} className="cursor-pointer flex-1">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="flex gap-2">
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
              disabled={!answers[currentQuestion.id] || loading}
              className="flex-1"
            >
              {loading ? 'Completing...' : currentStep === assessmentQuestions.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
