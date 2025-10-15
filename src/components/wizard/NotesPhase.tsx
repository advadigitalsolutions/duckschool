import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { RichTextEditor } from '../RichTextEditor';
import { AssignmentContentRenderer } from '../AssignmentContentRenderer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

interface NotesPhaseProps {
  assignmentId: string;
  studentId: string;
  keyConcepts: any[];
  onComplete: () => void;
  onBack: () => void;
}

export const NotesPhase: React.FC<NotesPhaseProps> = ({
  assignmentId,
  studentId,
  keyConcepts,
  onComplete,
  onBack
}) => {
  const [notes, setNotes] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
  }, [assignmentId, studentId]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_notes')
        .select('content')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;
      if (data?.content) {
        setNotes(data.content);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleSaveNotes = async (content: any) => {
    setNotes(content);
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('assignment_notes')
        .upsert([{
          assignment_id: assignmentId,
          student_id: studentId,
          content
        }], {
          onConflict: 'assignment_id,student_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatInstructions = () => {
    const conceptsList = keyConcepts?.map((kc: any) => 
      `### ${kc.concept}\n${kc.what_to_understand}`
    ).join('\n\n') || '';

    return `## 📝 Learn & Take Notes\n\nGo through the resources you found and take notes on the key concepts.\n\n**Key topics to understand:**\n\n${conceptsList}\n\n**Note-taking tips:**\n- Write in your own words\n- Include examples that help you understand\n- Note connections between concepts\n- Ask questions about things that are unclear`;
  };

  // Check if notes have meaningful content (more than just empty paragraphs)
  const hasSubstantiveNotes = () => {
    const notesString = JSON.stringify(notes);
    return notesString.length > 100; // Rough check for meaningful content
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-primary/20 bg-primary/5">
        <AssignmentContentRenderer content={formatInstructions()} />
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-3">Your Notes</h3>
        <RichTextEditor
          content={notes}
          onChange={handleSaveNotes}
          placeholder="Start taking notes on what you're learning..."
        />
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Research
        </Button>

        <Button
          onClick={onComplete}
          disabled={!hasSubstantiveNotes()}
          size="lg"
          className="min-w-[200px]"
        >
          {hasSubstantiveNotes() ? (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Continue to Discussion
            </>
          ) : (
            'Add notes to continue'
          )}
        </Button>
      </div>
    </div>
  );
};
