import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { RichTextEditor } from './RichTextEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Pin, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface AssignmentNotesProps {
  assignmentId: string;
  studentId: string;
  courseId: string;
}

export function AssignmentNotes({ assignmentId, studentId, courseId }: AssignmentNotesProps) {
  const [content, setContent] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinTitle, setPinTitle] = useState('');

  useEffect(() => {
    loadNotes();
  }, [assignmentId, studentId]);

  // Auto-save when content changes (debounced in RichTextEditor)
  useEffect(() => {
    if (!noteId || !content) return;
    saveNotes();
  }, [content]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_notes')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setNoteId(data.id);
        setContent((data.content as any)?.html || '');
      } else {
        // Create initial note
        const { data: newNote, error: createError } = await supabase
          .from('assignment_notes')
          .insert({
            assignment_id: assignmentId,
            student_id: studentId,
            content: { html: '' },
          })
          .select()
          .single();

        if (createError) throw createError;
        setNoteId(newNote.id);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    }
  };

  const saveNotes = async () => {
    if (!noteId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('assignment_notes')
        .update({
          content: { html: content },
        })
        .eq('id', noteId);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handlePin = async () => {
    if (!pinTitle.trim()) {
      toast.error('Please enter a title for your reference note');
      return;
    }

    try {
      const { error } = await supabase
        .from('course_reference_notes')
        .insert({
          student_id: studentId,
          course_id: courseId,
          title: pinTitle,
          content: { html: content },
          source_assignment_id: assignmentId,
        });

      if (error) throw error;

      toast.success('Notes pinned to course reference library');
      setShowPinDialog(false);
      setPinTitle('');
    } catch (error) {
      console.error('Error pinning notes:', error);
      toast.error('Failed to pin notes');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Notes</CardTitle>
            <div className="flex gap-2">
              {saving && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Save className="h-3 w-3 animate-pulse" />
                  Saving...
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPinDialog(true)}
                disabled={!content.trim()}
              >
                <Pin className="h-4 w-4 mr-2" />
                Pin to Reference Library
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Take notes here... You can type, format text, and paste screenshots (Ctrl/Cmd + V)"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Your notes auto-save as you type. You can paste screenshots directly into the editor.
          </p>
        </CardContent>
      </Card>

      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pin Notes to Reference Library</DialogTitle>
            <DialogDescription>
              Save these notes to your course reference library for easy access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Note Title</label>
              <Input
                placeholder="e.g., Key concepts from this assignment"
                value={pinTitle}
                onChange={(e) => setPinTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePin}>
              <Pin className="h-4 w-4 mr-2" />
              Pin Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}