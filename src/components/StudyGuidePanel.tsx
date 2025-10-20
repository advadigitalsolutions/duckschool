import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ExternalLink, ChevronDown, Lightbulb, BookOpen, Video, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TextToSpeech } from './TextToSpeech';

interface StudyGuideHint {
  type: 'context' | 'resource_link' | 'reading_reference' | 'concept_explanation';
  text: string;
  links?: Array<{
    url: string;
    title: string;
    description?: string;
  }>;
  page_reference?: string;
  confidence: 'high' | 'medium';
}

interface StudyGuideResource {
  url: string;
  title: string;
  type: 'video' | 'article' | 'interactive';
  duration?: string;
}

interface QuestionStudyGuide {
  hints: StudyGuideHint[];
  additional_resources?: StudyGuideResource[];
}

interface StudyGuidePanelProps {
  assignmentId: string;
  questions: any[];
  studentProfile: {
    grade_level: string;
    learning_style?: string;
    interests?: string[];
  };
  readingMaterials?: {
    title: string;
    page_references: Record<string, number[]>;
  };
  studentId?: string;
  onLinkClick?: (url: string, title: string) => void;
}

export function StudyGuidePanel({ 
  assignmentId, 
  questions, 
  studentProfile, 
  readingMaterials,
  studentId,
  onLinkClick
}: StudyGuidePanelProps) {
  const [studyGuide, setStudyGuide] = useState<Record<string, QuestionStudyGuide>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMoreHints, setLoadingMoreHints] = useState<Record<string, boolean>>({});
  const [hintLevels, setHintLevels] = useState<Record<string, number>>({});
  const [openQuestions, setOpenQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadStudyGuide();
  }, [assignmentId]);

  const loadStudyGuide = async () => {
    try {
      setLoading(true);
      console.log('Loading study guide for assignment:', assignmentId);

      // First check if there's a cached study guide
      const { data: cachedData, error: cacheError } = await supabase
        .from('assignment_study_guides')
        .select('study_guide, generated_at')
        .eq('assignment_id', assignmentId)
        .maybeSingle();

      if (!cacheError && cachedData && cachedData.study_guide) {
        console.log('Using cached study guide');
        const cachedGuide = cachedData.study_guide as unknown as Record<string, QuestionStudyGuide>;
        
        // Map numeric keys to actual question IDs
        const mappedGuide: Record<string, QuestionStudyGuide> = {};
        questions.forEach((q, index) => {
          const key = (index + 1).toString();
          if (cachedGuide[key]) {
            mappedGuide[q.id] = cachedGuide[key];
          } else if (cachedGuide[q.id]) {
            mappedGuide[q.id] = cachedGuide[q.id];
          }
        });
        
        console.log('Mapped cached study guide with', Object.keys(mappedGuide).length, 'questions');
        setStudyGuide(mappedGuide);
        
        // Initialize hint levels to 1 for all questions
        const initialLevels: Record<string, number> = {};
        questions.forEach(q => {
          initialLevels[q.id] = 1;
        });
        setHintLevels(initialLevels);
        setLoading(false);
        return;
      }

      // If no cache, generate new study guide
      console.log('No cached study guide found, generating new one');
      const { data, error } = await supabase.functions.invoke('generate-study-guide', {
        body: {
          assignment_id: assignmentId,
          questions: questions.map(q => ({
            id: q.id,
            question: q.question,
            type: q.type,
            options: q.options
          })),
          student_profile: studentProfile,
          reading_materials: readingMaterials
        }
      });

      if (error) {
        console.error('Error generating study guide:', error);
        toast.error('Failed to load study guide');
        return;
      }

      console.log('Study guide generated:', data);
      setStudyGuide(data.study_guide || {});
      
      // Map numeric keys to actual question IDs if needed
      const mappedGuide: Record<string, QuestionStudyGuide> = {};
      const guideData = data.study_guide || {};
      
      questions.forEach((q, index) => {
        // Check both the question ID and the index-based key (1, 2, 3...)
        const key = (index + 1).toString();
        if (guideData[key]) {
          mappedGuide[q.id] = guideData[key];
        } else if (guideData[q.id]) {
          mappedGuide[q.id] = guideData[q.id];
        }
      });
      
      console.log('Mapped study guide:', mappedGuide);
      setStudyGuide(mappedGuide);
      
      // Initialize hint levels to 1 for all questions
      const initialLevels: Record<string, number> = {};
      questions.forEach(q => {
        initialLevels[q.id] = 1;
      });
      setHintLevels(initialLevels);
      
    } catch (error) {
      console.error('Error loading study guide:', error);
      toast.error('Failed to load study guide');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMoreHints = async (questionId: string) => {
    const currentLevel = hintLevels[questionId] || 1;
    if (currentLevel >= 3) {
      toast.info('You\'ve reached the maximum hint level for this question');
      return;
    }

    try {
      setLoadingMoreHints(prev => ({ ...prev, [questionId]: true }));
      
      const question = questions.find(q => q.id === questionId);
      const existingHints = studyGuide[questionId]?.hints || [];
      
      console.log(`Requesting Level ${currentLevel + 1} hints for question:`, questionId);

      const { data, error } = await supabase.functions.invoke('generate-study-guide', {
        body: {
          assignment_id: assignmentId,
          questions: [question],
          student_profile: studentProfile,
          reading_materials: readingMaterials,
          question_id: questionId,
          current_hint_level: currentLevel + 1,
          existing_hints: existingHints
        }
      });

      if (error) {
        console.error('Error generating more hints:', error);
        toast.error('Failed to generate more hints');
        return;
      }

      // Append new hints to existing ones
      setStudyGuide(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          hints: [...(prev[questionId]?.hints || []), ...(data.hints || [])],
          additional_resources: data.additional_resources || prev[questionId]?.additional_resources
        }
      }));

      setHintLevels(prev => ({
        ...prev,
        [questionId]: currentLevel + 1
      }));

      // Track hint usage if student is logged in
      if (studentId) {
        await supabase.from('study_guide_interactions').insert({
          student_id: studentId,
          assignment_id: assignmentId,
          question_id: questionId,
          hint_level: currentLevel + 1
        });
      }

      toast.success(`Level ${currentLevel + 1} hints revealed!`);
      
    } catch (error) {
      console.error('Error requesting more hints:', error);
      toast.error('Failed to generate more hints');
    } finally {
      setLoadingMoreHints(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const toggleQuestion = (questionId: string) => {
    setOpenQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Study Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasStudyGuide = Object.keys(studyGuide).length > 0;

  if (!hasStudyGuide) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Study Guide
        </CardTitle>
        <CardDescription>
          Helpful resources to guide your learning. Use these to understand concepts, but try to work through the questions yourself first!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question, index) => {
          const guide = studyGuide[question.id];
          if (!guide || !guide.hints || guide.hints.length === 0) return null;

          const currentLevel = hintLevels[question.id] || 1;
          const isOpen = openQuestions[question.id] || false;

          return (
            <Collapsible key={question.id} open={isOpen} onOpenChange={() => toggleQuestion(question.id)}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                  <span className="font-medium text-left">Question {index + 1}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 pb-2 px-2">
                <div className="space-y-4">
                  {/* Hints */}
                  <div className="space-y-3">
                    {guide.hints.map((hint, hintIndex) => (
                      <div key={hintIndex} className="border-l-4 border-primary pl-4 py-2">
                        {hint.type === 'resource_link' && (
                          <div className="space-y-2">
                            <TextToSpeech text={hint.text}>
                              <p className="text-sm text-muted-foreground">{hint.text}</p>
                            </TextToSpeech>
                            {hint.links?.map((link, linkIndex) => (
                              <button
                                key={linkIndex}
                                onClick={() => onLinkClick?.(link.url, link.title)}
                                className="flex items-center gap-2 text-primary hover:underline text-sm w-full text-left"
                              >
                                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                                <div>
                                  <div className="font-medium">{link.title}</div>
                                  {link.description && (
                                    <div className="text-xs text-muted-foreground">{link.description}</div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {hint.type === 'reading_reference' && (
                          <TextToSpeech text={`Check your reading: ${hint.page_reference}`}>
                            <div className="flex items-start gap-2">
                              <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                              <p className="text-sm">
                                <span className="font-medium">Check your reading:</span> {hint.page_reference}
                              </p>
                            </div>
                          </TextToSpeech>
                        )}

                        {(hint.type === 'concept_explanation' || hint.type === 'context') && (
                          <TextToSpeech text={hint.text}>
                            <p className="text-sm text-muted-foreground">{hint.text}</p>
                          </TextToSpeech>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Additional Resources */}
                  {guide.additional_resources && guide.additional_resources.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-3">Additional Resources:</p>
                      <div className="space-y-2">
                        {guide.additional_resources.map((resource, resIndex) => (
                          <button
                            key={resIndex}
                            onClick={() => onLinkClick?.(resource.url, resource.title)}
                            className="flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded-lg hover:bg-accent transition-colors w-full text-left"
                          >
                            {resource.type === 'video' && <Video className="h-4 w-4 flex-shrink-0" />}
                            {resource.type === 'article' && <FileText className="h-4 w-4 flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{resource.title}</div>
                              {resource.duration && (
                                <div className="text-xs text-muted-foreground">{resource.duration}</div>
                              )}
                            </div>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Get More Hints Button */}
                  {currentLevel < 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRequestMoreHints(question.id)}
                      disabled={loadingMoreHints[question.id]}
                      className="w-full mt-4"
                    >
                      {loadingMoreHints[question.id] ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating Level {currentLevel + 1} Hints...
                        </>
                      ) : (
                        <>
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Get More Hints (Level {currentLevel + 1}/3)
                        </>
                      )}
                    </Button>
                  )}
                  {currentLevel === 3 && (
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      You've unlocked all available hints for this question
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
