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

interface DeleteCourseDialogProps {
  course: any;
  onCourseDeleted: () => void;
  trigger?: React.ReactNode;
}

export function DeleteCourseDialog({ course, onCourseDeleted, trigger }: DeleteCourseDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // First, get all curriculum items for this course
      const { data: curriculumItems } = await supabase
        .from('curriculum_items')
        .select('id')
        .eq('course_id', course.id);

      if (curriculumItems && curriculumItems.length > 0) {
        const curriculumItemIds = curriculumItems.map(ci => ci.id);

        // Get all assignments for these curriculum items
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id')
          .in('curriculum_item_id', curriculumItemIds);

        if (assignments && assignments.length > 0) {
          const assignmentIds = assignments.map(a => a.id);

          // Delete submissions and related data
          const { data: submissions } = await supabase
            .from('submissions')
            .select('id')
            .in('assignment_id', assignmentIds);

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
            .in('assignment_id', assignmentIds);

          // Delete submissions
          await supabase
            .from('submissions')
            .delete()
            .in('assignment_id', assignmentIds);

          // Delete progress events
          await supabase
            .from('progress_events')
            .delete()
            .in('assignment_id', assignmentIds);

          // Delete assignments
          await supabase
            .from('assignments')
            .delete()
            .in('curriculum_item_id', curriculumItemIds);
        }

        // Delete curriculum items
        await supabase
          .from('curriculum_items')
          .delete()
          .eq('course_id', course.id);
      }

      // Finally, delete the course
      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);

      if (courseError) throw courseError;

      toast.success('Course deleted successfully');
      onCourseDeleted();
    } catch (error: any) {
      toast.error('Failed to delete course');
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
          <AlertDialogTitle>Delete Course?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This will permanently delete the course "{course.title}" and all associated data including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All curriculum items and lesson plans</li>
              <li>All assignments and questions</li>
              <li>All student submissions and responses</li>
              <li>All grades and progress data</li>
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
            {loading ? 'Deleting...' : 'Delete Course'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
