import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface DeleteAssignmentDialogProps {
  assignment: any;
  onAssignmentDeleted: () => void;
  trigger?: React.ReactNode;
}

export function DeleteAssignmentDialog({ assignment, onAssignmentDeleted, trigger }: DeleteAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Delete submissions and responses first (cascade should handle this, but being explicit)
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id')
        .eq('assignment_id', assignment.id);

      if (submissions && submissions.length > 0) {
        const submissionIds = submissions.map(s => s.id);
        
        // Delete question responses
        await supabase
          .from('question_responses')
          .delete()
          .in('submission_id', submissionIds);
      }

      // Delete grades
      await supabase
        .from('grades')
        .delete()
        .eq('assignment_id', assignment.id);

      // Delete submissions
      await supabase
        .from('submissions')
        .delete()
        .eq('assignment_id', assignment.id);

      // Delete progress events
      await supabase
        .from('progress_events')
        .delete()
        .eq('assignment_id', assignment.id);

      // Delete the assignment
      const { error: assignmentError } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignment.id);

      if (assignmentError) throw assignmentError;

      // Delete the curriculum item
      const { error: curriculumError } = await supabase
        .from('curriculum_items')
        .delete()
        .eq('id', assignment.curriculum_item_id);

      if (curriculumError) throw curriculumError;

      toast.success('Assignment deleted successfully');
      onAssignmentDeleted();
    } catch (error: any) {
      toast.error('Failed to delete assignment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This will permanently delete the assignment "{assignment.curriculum_items?.body?.title || assignment.curriculum_items?.title}" and all associated data including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Student submissions</li>
              <li>Question responses</li>
              <li>Grades and feedback</li>
              <li>Progress tracking data</li>
            </ul>
            <p className="font-medium text-destructive mt-2">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete Assignment'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
