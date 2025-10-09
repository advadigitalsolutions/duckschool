import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Clock, Target, BookOpen, Loader2 } from 'lucide-react';

interface AssignmentSuggestion {
  title: string;
  description: string;
  standardCode: string;
  estimatedMinutes: number;
  objectives: string[];
  materials?: string[];
  pedagogy_notes?: string;
}

interface CurriculumGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  onGenerated?: () => void;
}

export function CurriculumGenerationDialog({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  onGenerated
}: CurriculumGenerationDialogProps) {
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AssignmentSuggestion[]>([]);
  const [uncoveredCount, setUncoveredCount] = useState(0);
  const [pedagogy, setPedagogy] = useState('');
  const [framework, setFramework] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setSuggestions([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-curriculum', {
        body: { courseId }
      });

      if (error) throw error;

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setUncoveredCount(data.uncoveredCount);
        setPedagogy(data.pedagogy);
        setFramework(data.framework);
        toast.success(`Generated ${data.suggestions.length} assignment suggestions`);
      } else {
        toast.info(data.message || 'All standards are already covered!');
      }
    } catch (error: any) {
      console.error('Error generating curriculum:', error);
      toast.error('Failed to generate curriculum suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateAssignment = async (suggestion: AssignmentSuggestion) => {
    try {
      // First, create a curriculum item
      const { data: curriculumItem, error: curriculumError } = await supabase
        .from('curriculum_items')
        .insert({
          course_id: courseId,
          title: suggestion.title,
          type: 'lesson',
          body: {
            description: suggestion.description,
            objectives: suggestion.objectives,
            materials: suggestion.materials || []
          },
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
          status: 'draft'
        });

      if (assignmentError) throw assignmentError;

      toast.success('Assignment created successfully');
      
      // Remove this suggestion from the list
      setSuggestions(prev => prev.filter(s => s.standardCode !== suggestion.standardCode));
      
      onGenerated?.();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    }
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
          {suggestions.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Generate AI-Powered Curriculum</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {framework === 'CUSTOM' 
                  ? 'Our AI will analyze your course goals and learning milestones to create personalized assignment recommendations.'
                  : 'Our AI will analyze uncovered standards and create personalized assignment recommendations based on your student\'s learning profile and selected pedagogy.'}
              </p>
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
                      : `${uncoveredCount} uncovered standards • ${pedagogy} pedagogy • ${framework}`}
                  </p>
                </div>
                <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Regenerate'
                  )}
                </Button>
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
                        <Button onClick={() => handleCreateAssignment(suggestion)}>
                          Create Assignment
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
