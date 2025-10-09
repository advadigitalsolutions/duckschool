import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface ProfileAssessmentProps {
  studentId: string;
  onComplete: () => void;
}

export function ProfileAssessment({ studentId, onComplete }: ProfileAssessmentProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
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

  const generateAssessment = async () => {
    try {
      setGenerating(true);
      
      const { data, error } = await supabase.functions.invoke('generate-profile-assessment', {
        body: {
          studentName: student?.display_name || student?.name,
          gradeLevel: student?.grade_level || 'K-12'
        }
      });

      if (error) throw error;
      
      setAssessment(data);
    } catch (error: any) {
      console.error('Error generating assessment:', error);
      toast.error('Failed to generate assessment');
    } finally {
      setGenerating(false);
    }
  };

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
      assessment.questions.forEach((q: any) => {
        if (answers[q.id]) {
          if (!learningProfile.categories[q.category]) {
            learningProfile.categories[q.category] = [];
          }
          learningProfile.categories[q.category].push(answers[q.id]);
        }
      });

      // Determine personality type based on responses (simplified)
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
    // Simple personality type determination based on learning style preferences
    const learningStyles = categories.learning_style || [];
    
    if (learningStyles.includes('Watch videos or demonstrations')) {
      return 'Visual Learner';
    } else if (learningStyles.includes('Try it hands-on')) {
      return 'Kinesthetic Learner';
    } else if (learningStyles.includes('Read about it')) {
      return 'Reading/Writing Learner';
    } else if (learningStyles.includes('Discuss it with others')) {
      return 'Auditory Learner';
    }
    
    return 'Multimodal Learner';
  };

  if (completed) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <CardTitle>Assessment Completed!</CardTitle>
          </div>
          <CardDescription>
            Your learning profile has been saved and will be used to personalize your assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Personality Type</p>
              <p className="text-lg font-semibold">{student?.personality_type}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setCompleted(false);
                setAssessment(null);
                setAnswers({});
              }}
            >
              Retake Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learning Profile Assessment</CardTitle>
          <CardDescription>
            Take this one-time assessment to help us understand how you learn best. 
            This will help create personalized assignments just for you!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generateAssessment} disabled={generating} className="w-full">
            {generating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Generating Assessment...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Start Assessment
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{assessment.title}</CardTitle>
        <CardDescription>{assessment.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {assessment.questions.map((question: any, index: number) => (
          <div key={question.id} className="space-y-3 p-4 rounded-lg border">
            <Label className="text-base font-medium">
              {index + 1}. {question.question}
            </Label>
            
            {question.type === 'multiple_choice' ? (
              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}
              >
                {question.options.map((option: string, optIndex: number) => (
                  <div key={optIndex} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                    <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                value={answers[question.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                placeholder="Type your answer here..."
                className="min-h-[100px]"
              />
            )}
          </div>
        ))}

        <Button 
          onClick={handleSubmit} 
          disabled={loading || Object.keys(answers).length < assessment.questions.length}
          className="w-full"
        >
          {loading ? 'Saving...' : 'Complete Assessment'}
        </Button>
      </CardContent>
    </Card>
  );
}
