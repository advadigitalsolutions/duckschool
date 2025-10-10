import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
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
import { Trash2, Loader2, Undo2 } from 'lucide-react';

interface DeleteAssignmentDialogProps {
  assignment: any;
  onAssignmentDeleted: () => void;
  trigger?: React.ReactNode;
}

interface ImpactData {
  submissionsCount: number;
  gradesCount: number;
  responsesCount: number;
}

export function DeleteAssignmentDialog({ assignment, onAssignmentDeleted, trigger }: DeleteAssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);

  useEffect(() => {
    if (open && assignment) {
      loadImpactData();
    }
  }, [open, assignment]);

  const loadImpactData = async () => {
    setLoadingImpact(true);
    try {
      // Get submissions count
      const { count: submissionsCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id);

      // Get grades count
      const { count: gradesCount } = await supabase
        .from('grades')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id);

      // Get question responses count
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id')
        .eq('assignment_id', assignment.id);

      let responsesCount = 0;
      if (submissions && submissions.length > 0) {
        const submissionIds = submissions.map(s => s.id);
        const { count: rCount } = await supabase
          .from('question_responses')
          .select('*', { count: 'exact', head: true })
          .in('submission_id', submissionIds);
        responsesCount = rCount || 0;
      }

      setImpactData({
        submissionsCount: submissionsCount || 0,
        gradesCount: gradesCount || 0,
        responsesCount,
      });
    } catch (error) {
      console.error('Error loading impact data:', error);
    } finally {
      setLoadingImpact(false);
    }
  };

  const backupAndDelete = async () => {
    setLoading(true);
    try {
      // Backup all data before deletion
      const backup: any = { 
        assignment,
        curriculumItem: null 
      };

      // Get curriculum item
      const { data: curriculumItem } = await supabase
        .from('curriculum_items')
        .select('*')
        .eq('id', assignment.curriculum_item_id)
        .single();
      backup.curriculumItem = curriculumItem;

      // Get submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignment.id);
      backup.submissions = submissions;

      // Get grades
      const { data: grades } = await supabase
        .from('grades')
        .select('*')
        .eq('assignment_id', assignment.id);
      backup.grades = grades;

      // Get question responses
      if (submissions && submissions.length > 0) {
        const submissionIds = submissions.map((s: any) => s.id);
        const { data: responses } = await supabase
          .from('question_responses')
          .select('*')
          .in('submission_id', submissionIds);
        backup.questionResponses = responses;
      }

      // Get progress events
      const { data: progressEvents } = await supabase
        .from('progress_events')
        .select('*')
        .eq('assignment_id', assignment.id);
      backup.progressEvents = progressEvents;

      // Delete submissions and responses
      if (submissions && submissions.length > 0) {
        const submissionIds = submissions.map((s: any) => s.id);
        
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

      // Show success toast with undo button
      const assignmentTitle = assignment.curriculum_items?.body?.title || assignment.curriculum_items?.title || 'Assignment';
      const toastId = toast.success(
        `${assignmentTitle} deleted successfully`,
        {
          duration: 30000, // 30 seconds
          action: {
            label: <div className="flex items-center gap-1"><Undo2 className="h-3 w-3" /> Undo</div>,
            onClick: async () => {
              await restoreAssignment(backup);
              toast.dismiss(toastId);
            },
          },
        }
      );

      setOpen(false);
      onAssignmentDeleted();
    } catch (error: any) {
      toast.error('Failed to delete assignment');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const restoreAssignment = async (backup: any) => {
    try {
      toast.info('Restoring assignment...');

      // Restore curriculum item
      if (backup.curriculumItem) {
        const { error: curriculumError } = await supabase
          .from('curriculum_items')
          .insert([backup.curriculumItem]);
        if (curriculumError) throw curriculumError;
      }

      // Restore assignment
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert([backup.assignment]);
      if (assignmentError) throw assignmentError;

      // Restore submissions
      if (backup.submissions && backup.submissions.length > 0) {
        await supabase.from('submissions').insert(backup.submissions);
      }

      // Restore grades
      if (backup.grades && backup.grades.length > 0) {
        await supabase.from('grades').insert(backup.grades);
      }

      // Restore question responses
      if (backup.questionResponses && backup.questionResponses.length > 0) {
        await supabase.from('question_responses').insert(backup.questionResponses);
      }

      // Restore progress events
      if (backup.progressEvents && backup.progressEvents.length > 0) {
        await supabase.from('progress_events').insert(backup.progressEvents);
      }

      toast.success('Assignment restored successfully');
      onAssignmentDeleted(); // Refresh the list
    } catch (error: any) {
      console.error('Error restoring assignment:', error);
      toast.error('Failed to restore assignment. Please contact support.');
    }
  };

  const assignmentTitle = assignment?.curriculum_items?.body?.title || assignment?.curriculum_items?.title || 'this assignment';

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Delete Assignment?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="font-medium text-foreground">
              Are you sure you want to delete <strong>"{assignmentTitle}"</strong>?
            </p>

            {loadingImpact ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : impactData ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">This will permanently delete:</p>
                <ul className="text-sm space-y-1">
                  {impactData.submissionsCount > 0 && (
                    <li>• {impactData.submissionsCount} student submission{impactData.submissionsCount !== 1 ? 's' : ''}</li>
                  )}
                  {impactData.responsesCount > 0 && (
                    <li>• {impactData.responsesCount} question response{impactData.responsesCount !== 1 ? 's' : ''}</li>
                  )}
                  {impactData.gradesCount > 0 && (
                    <li>• {impactData.gradesCount} grade{impactData.gradesCount !== 1 ? 's' : ''} & feedback</li>
                  )}
                  <li>• The lesson/curriculum item</li>
                  <li>• All progress tracking data</li>
                </ul>
              </div>
            ) : null}

            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">
                💡 <strong>You'll have 30 seconds to undo</strong> this action after deletion.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            onClick={backupAndDelete}
            disabled={loading || loadingImpact}
            variant="destructive"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Assignment'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
