import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Clock, Target, BookOpen, Loader2, Info, CheckCircle2, Check } from 'lucide-react';

interface AssignmentSuggestion {
  title: string;
  description: string;
  standardCode: string;
  estimatedMinutes: number;
  objectives: string[];
  materials?: string[];
  pedagogy_notes?: string;
  created?: boolean;
}

interface CurriculumGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  studentId: string;
  onGenerated?: () => void;
}

export function CurriculumGenerationDialog({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  studentId,
  onGenerated
}: CurriculumGenerationDialogProps) {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [creatingAll, setCreatingAll] = useState(false);
  const [creatingIndex, setCreatingIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<AssignmentSuggestion[]>([]);
  const [uncoveredCount, setUncoveredCount] = useState(0);
  const [pedagogy, setPedagogy] = useState('');
  const [framework, setFramework] = useState('');
  const [approachOverride, setApproachOverride] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const [isBridgeMode, setIsBridgeMode] = useState(false);
  const [diagnosticTopics, setDiagnosticTopics] = useState<string[]>([]);
  const [showApiKeyError, setShowApiKeyError] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setSuggestions([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-curriculum', {
        body: { 
          courseId,
          approachOverride: approachOverride || undefined
        }
      });

      if (error) throw error;

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setUncoveredCount(data.uncoveredCount);
        setPedagogy(data.pedagogy);
        setFramework(data.framework);
        setIsBridgeMode(data.isBridgeMode || false);
        setDiagnosticTopics(data.diagnosticTopics || []);
        toast.success(`Generated ${data.suggestions.length} assignment suggestions`);
      } else {
        // Show appropriate message based on the response
        const message = data.message || (
          data.framework === 'CUSTOM' 
            ? 'No curriculum suggestions generated. Please ensure your course has goals set in course settings.' 
            : 'All standards are already covered!'
        );
        toast.info(message);
      }
    } catch (error: any) {
      console.error('Error generating curriculum:', error);
      
      // Check if it's an OpenAI quota/credit error
      const errorMessage = error?.message || '';
      const isQuotaError = errorMessage.includes('429') || 
                          errorMessage.includes('quota') || 
                          errorMessage.includes('insufficient_quota') ||
                          errorMessage.includes('rate_limit');
      
      if (isQuotaError) {
        setShowApiKeyError(true);
      } else {
        toast.error('Failed to generate curriculum suggestions');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateAssignment = async (suggestion: AssignmentSuggestion, index: number) => {
    setCreatingIndex(index);
    try {
      // Generate actual lesson questions
      toast.info('Generating lesson content...');
      const { data: generatedAssignment, error: generateError } = await supabase.functions.invoke('generate-assignment', {
        body: {
          courseId: courseId,
          topic: suggestion.title,
          manualStandards: [suggestion.standardCode],
          approachOverride: approachOverride || undefined
        }
      });

      if (generateError) {
        console.error('Generation error:', generateError);
        const errorMessage = generateError?.message || '';
        const isQuotaError = errorMessage.includes('429') || 
                            errorMessage.includes('quota') || 
                            errorMessage.includes('insufficient_quota') ||
                            errorMessage.includes('rate_limit');
        
        if (isQuotaError) {
          setShowApiKeyError(true);
          setCreatingIndex(null);
          return;
        }
        throw generateError;
      }
      
      if (!generatedAssignment) {
        console.error('No assignment data returned');
        throw new Error('No assignment data returned from edge function');
      }
      
      console.log('Generated assignment data:', generatedAssignment);

      // Create curriculum item with generated content
      const { data: curriculumItem, error: curriculumError } = await supabase
        .from('curriculum_items')
        .insert({
          course_id: courseId,
          title: suggestion.title,
          type: 'lesson',
          body: generatedAssignment,
          standards: [suggestion.standardCode],
          est_minutes: suggestion.estimatedMinutes
        })
        .select()
        .single();

      if (curriculumError) throw curriculumError;

      // Then create an assignment for this curriculum item
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          curriculum_item_id: curriculumItem.id,
          status: 'assigned'
        });

      if (assignmentError) throw assignmentError;

      toast.success('Assignment created successfully');
      
      // Mark this suggestion as created instead of removing it
      setSuggestions(prev => prev.map((s, i) => 
        i === index ? { ...s, created: true } : s
      ));
      
      // Check if all suggestions are created
      const allCreated = suggestions.every((s, i) => i === index || s.created);
      if (allCreated) {
        onGenerated?.();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setCreatingIndex(null);
    }
  };

  const handleCreateAll = async () => {
    setCreatingAll(true);
    const uncreatedSuggestions = suggestions.filter(s => !s.created);
    let successCount = 0;
    
    toast.info(`Generating ${uncreatedSuggestions.length} lessons with full content...`);
    
    try {
      for (let i = 0; i < suggestions.length; i++) {
        const suggestion = suggestions[i];
        if (suggestion.created) continue;

        try {
          // Generate actual lesson questions
          const { data: generatedAssignment, error: generateError } = await supabase.functions.invoke('generate-assignment', {
            body: {
              courseId: courseId,
              topic: suggestion.title,
              manualStandards: [suggestion.standardCode],
              approachOverride: approachOverride || undefined
            }
          });

          if (generateError) {
            console.error('Generation error:', generateError);
            const errorMessage = generateError?.message || '';
            const isQuotaError = errorMessage.includes('429') || 
                                errorMessage.includes('quota') || 
                                errorMessage.includes('insufficient_quota') ||
                                errorMessage.includes('rate_limit');
            
            if (isQuotaError) {
              setShowApiKeyError(true);
              setCreatingAll(false);
              return;
            }
            throw generateError;
          }
          
          if (!generatedAssignment) {
            console.error('No assignment data returned');
            throw new Error('No assignment data returned from edge function');
          }
          
          console.log('Generated assignment data:', generatedAssignment);

          const { data: curriculumItem, error: curriculumError } = await supabase
            .from('curriculum_items')
            .insert({
              course_id: courseId,
              title: suggestion.title,
              type: 'lesson',
              body: generatedAssignment,
              standards: [suggestion.standardCode],
              est_minutes: suggestion.estimatedMinutes
            })
            .select()
            .single();

          if (curriculumError) throw curriculumError;

          const { error: assignmentError } = await supabase
            .from('assignments')
            .insert({
              curriculum_item_id: curriculumItem.id,
              status: 'assigned'
            });

          if (assignmentError) throw assignmentError;

          successCount++;
          setSuggestions(prev => prev.map((s, idx) => 
            idx === i ? { ...s, created: true } : s
          ));
        } catch (error) {
          console.error(`Error creating assignment ${i}:`, error);
        }
      }

      toast.success(`Created ${successCount} of ${uncreatedSuggestions.length} assignments`);
      
      if (successCount > 0) {
        onGenerated?.();
        onOpenChange(false);
      }
    } finally {
      setCreatingAll(false);
    }
  };

  const handleGenerateMore = () => {
    setShowCompletion(false);
    setSuggestions([]);
    setCreatedCount(0);
  };

  const handleGoToCurriculum = () => {
    onOpenChange(false);
    navigate(`/course/${courseId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Curriculum Generation
          </DialogTitle>
          <DialogDescription>
            Generate personalized assignments based on uncovered learning objectives, student profile, and pedagogy
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {showApiKeyError ? (
            <div className="text-center py-8 space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-4">
                  <Info className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">OpenAI API Credits Exhausted</h3>
                <p className="text-muted-foreground">
                  Your OpenAI API key has run out of credits. Please update your API key with one that has available credits to continue generating curriculum.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => {
                    setShowApiKeyError(false);
                    onOpenChange(false);
                  }}
                  variant="outline"
                  size="lg"
                  className="min-w-[200px]"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : showCompletion ? (
            <div className="text-center py-8 space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Curriculum Created Successfully!</h3>
                <p className="text-muted-foreground">
                  {createdCount} assignment{createdCount !== 1 ? 's' : ''} created and ready to assign.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={handleGoToCurriculum}
                  size="lg"
                  className="min-w-[200px]"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Curriculum
                </Button>
                <Button 
                  onClick={handleGenerateMore}
                  variant="outline"
                  size="lg"
                  className="min-w-[200px]"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate More
                </Button>
                <Button 
                  onClick={() => onOpenChange(false)}
                  variant="ghost"
                  size="lg"
                  className="min-w-[200px]"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Generate AI-Powered Curriculum</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {framework === 'CUSTOM' 
                    ? 'Our AI will analyze your course goals and learning milestones to create personalized assignment recommendations.'
                    : 'Our AI will analyze uncovered standards and create personalized assignment recommendations based on your student\'s learning profile and selected pedagogy.'}
                </p>
              </div>

              <div className="space-y-3 px-2">
                <div className="space-y-2">
                  <Label htmlFor="approach-override" className="flex items-center gap-2">
                    Assignment Style Preference (Optional)
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </Label>
                  <Textarea
                    id="approach-override"
                    placeholder="e.g., 'I prefer Khan Academy videos and computer-based practice' or 'Keep activities screen-based, no physical props or costumes' or 'Use hands-on activities with everyday materials'"
                    value={approachOverride}
                    onChange={(e) => setApproachOverride(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tell the AI exactly how you want to learn. This overrides all other learning style suggestions.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Standards...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Suggestions
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
                <div>
                  <p className="font-semibold">
                    {suggestions.length} Assignment Suggestions
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {framework === 'CUSTOM' 
                      ? `${uncoveredCount} learning milestones • ${pedagogy} pedagogy • Custom Framework`
                      : isBridgeMode && diagnosticTopics.length > 0
                        ? `${diagnosticTopics.length} focus areas: ${diagnosticTopics.join(', ')} • ${pedagogy} pedagogy • Bridge Mode`
                        : `${uncoveredCount} uncovered standards • ${pedagogy} pedagogy • ${framework}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateAll} 
                    disabled={creatingAll || suggestions.every(s => s.created)}
                  >
                    {creatingAll ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating All...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create All ({suggestions.filter(s => !s.created).length})
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Regenerate'
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                          <CardDescription className="mt-1">
                            <Badge variant="outline" className="mr-2">
                              {suggestion.standardCode}
                            </Badge>
                            <span className="text-xs">{suggestion.description}</span>
                          </CardDescription>
                        </div>
                        <Button 
                          onClick={() => handleCreateAssignment(suggestion, index)}
                          disabled={suggestion.created || creatingIndex === index || creatingAll}
                        >
                          {creatingIndex === index ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : suggestion.created ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Created
                            </>
                          ) : (
                            'Create Assignment'
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {suggestion.estimatedMinutes} min
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4" />
                          <span className="font-medium text-sm">Learning Objectives:</span>
                        </div>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {suggestion.objectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>

                      {suggestion.materials && suggestion.materials.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4" />
                            <span className="font-medium text-sm">Materials Needed:</span>
                          </div>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {suggestion.materials.map((material, i) => (
                              <li key={i}>{material}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {suggestion.pedagogy_notes && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground italic">
                            <strong>Pedagogy Note:</strong> {suggestion.pedagogy_notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
