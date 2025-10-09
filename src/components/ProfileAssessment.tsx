import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { PersonalityReport } from './PersonalityReport';

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
          setAssessment(null);
          setAnswers({});
        }}
      />
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
