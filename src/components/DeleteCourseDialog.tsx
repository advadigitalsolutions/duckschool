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

interface DeleteCourseDialogProps {
  course: any;
  onCourseDeleted: () => void;
  trigger?: React.ReactNode;
}

interface ImpactData {
  curriculumItemsCount: number;
  assignmentsCount: number;
  submissionsCount: number;
  gradesCount: number;
}

export function DeleteCourseDialog({ course, onCourseDeleted, trigger }: DeleteCourseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);

  useEffect(() => {
    if (open && course) {
      loadImpactData();
    }
  }, [open, course]);

  const loadImpactData = async () => {
    setLoadingImpact(true);
    try {
      // Get curriculum items count
      const { count: curriculumCount } = await supabase
        .from('curriculum_items')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id);

      // Get curriculum items for further queries
      const { data: curriculumItems } = await supabase
        .from('curriculum_items')
        .select('id')
        .eq('course_id', course.id);

      let assignmentsCount = 0;
      let submissionsCount = 0;
      let gradesCount = 0;

      if (curriculumItems && curriculumItems.length > 0) {
        const curriculumItemIds = curriculumItems.map(ci => ci.id);

        // Get assignments count
        const { count: aCount } = await supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .in('curriculum_item_id', curriculumItemIds);
        assignmentsCount = aCount || 0;

        // Get assignments for further queries
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id')
          .in('curriculum_item_id', curriculumItemIds);

        if (assignments && assignments.length > 0) {
          const assignmentIds = assignments.map(a => a.id);

          // Get submissions count
          const { count: sCount } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .in('assignment_id', assignmentIds);
          submissionsCount = sCount || 0;

          // Get grades count
          const { count: gCount } = await supabase
            .from('grades')
            .select('*', { count: 'exact', head: true })
            .in('assignment_id', assignmentIds);
          gradesCount = gCount || 0;
        }
      }

      setImpactData({
        curriculumItemsCount: curriculumCount || 0,
        assignmentsCount,
        submissionsCount,
        gradesCount,
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
      const backup: any = { course };

      // Get all curriculum items
      const { data: curriculumItems, error: ciError } = await supabase
        .from('curriculum_items')
        .select('*')
        .eq('course_id', course.id);
      
      if (ciError) {
        console.error('Error fetching curriculum items:', ciError);
        throw new Error(`Failed to fetch curriculum items: ${ciError.message}`);
      }
      
      backup.curriculumItems = curriculumItems;

      if (curriculumItems && curriculumItems.length > 0) {
        const curriculumItemIds = curriculumItems.map((ci: any) => ci.id);

        // Get all assignments
        const { data: assignments, error: assignmentsError } = await supabase
          .from('assignments')
          .select('*')
          .in('curriculum_item_id', curriculumItemIds);
        
        if (assignmentsError) {
          console.error('Error fetching assignments:', assignmentsError);
          throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
        }
        
        backup.assignments = assignments;

        if (assignments && assignments.length > 0) {
          const assignmentIds = assignments.map((a: any) => a.id);

          // Get submissions
          const { data: submissions, error: submissionsError } = await supabase
            .from('submissions')
            .select('*')
            .in('assignment_id', assignmentIds);
          
          if (submissionsError) {
            console.error('Error fetching submissions:', submissionsError);
            throw new Error(`Failed to fetch submissions: ${submissionsError.message}`);
          }
          
          backup.submissions = submissions;

          // Get grades
          const { data: grades, error: gradesError } = await supabase
            .from('grades')
            .select('*')
            .in('assignment_id', assignmentIds);
          
          if (gradesError) {
            console.error('Error fetching grades:', gradesError);
            throw new Error(`Failed to fetch grades: ${gradesError.message}`);
          }
          
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
            .in('assignment_id', assignmentIds);
          backup.progressEvents = progressEvents;

          // Delete question responses
          if (submissions && submissions.length > 0) {
            const submissionIds = submissions.map((s: any) => s.id);
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

      // Get and backup progress gaps
      const { data: progressGaps } = await supabase
        .from('progress_gaps')
        .select('*')
        .eq('course_id', course.id);
      backup.progressGaps = progressGaps;

      // Delete progress gaps
      await supabase
        .from('progress_gaps')
        .delete()
        .eq('course_id', course.id);

      // Finally, delete the course
      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);

      if (courseError) {
        console.error('Course deletion error:', courseError);
        throw new Error(courseError.message || 'Failed to delete course');
      }

      // Close the dialog immediately to prevent UI getting stuck
      setOpen(false);

      // Wait for dialog animation to complete before showing toast and navigating
      setTimeout(() => {
        const toastId = toast.success(
          `${course.title} deleted successfully`,
          {
            duration: 30000, // 30 seconds
            action: {
              label: <div className="flex items-center gap-1"><Undo2 className="h-3 w-3" /> Undo</div>,
              onClick: async () => {
                await restoreCourse(backup);
                toast.dismiss(toastId);
              },
            },
          }
        );

        onCourseDeleted();
      }, 600);
    } catch (error: any) {
      console.error('Delete course error:', error);
      const errorMessage = error.message || error.details || 'Failed to delete course';
      toast.error(`Failed to delete course: ${errorMessage}`);
      setOpen(false); // Close the dialog on error
    } finally {
      setLoading(false);
    }
  };

  const restoreCourse = async (backup: any) => {
    try {
      toast.info('Restoring course data...');

      // Restore course
      const { error: courseError } = await supabase
        .from('courses')
        .insert([backup.course]);
      if (courseError) throw courseError;

      // Restore curriculum items
      if (backup.curriculumItems && backup.curriculumItems.length > 0) {
        await supabase.from('curriculum_items').insert(backup.curriculumItems);
      }

      // Restore assignments
      if (backup.assignments && backup.assignments.length > 0) {
        await supabase.from('assignments').insert(backup.assignments);
      }

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

      // Restore progress gaps
      if (backup.progressGaps && backup.progressGaps.length > 0) {
        await supabase.from('progress_gaps').insert(backup.progressGaps);
      }

      toast.success('Course restored successfully');
      onCourseDeleted(); // Refresh the list
    } catch (error: any) {
      console.error('Error restoring course:', error);
      toast.error('Failed to restore course. Please contact support.');
    }
  };

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
          <AlertDialogTitle>⚠️ Delete Course?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="font-medium text-foreground">
              Are you sure you want to delete <strong>"{course.title}"</strong>?
            </p>

            {loadingImpact ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : impactData ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">This will permanently delete:</p>
                <ul className="text-sm space-y-1">
                  {impactData.curriculumItemsCount > 0 && (
                    <li>• {impactData.curriculumItemsCount} curriculum item{impactData.curriculumItemsCount !== 1 ? 's' : ''} (lessons)</li>
                  )}
                  {impactData.assignmentsCount > 0 && (
                    <li>• {impactData.assignmentsCount} assignment{impactData.assignmentsCount !== 1 ? 's' : ''}</li>
                  )}
                  {impactData.submissionsCount > 0 && (
                    <li>• {impactData.submissionsCount} student submission{impactData.submissionsCount !== 1 ? 's' : ''}</li>
                  )}
                  {impactData.gradesCount > 0 && (
                    <li>• {impactData.gradesCount} grade{impactData.gradesCount !== 1 ? 's' : ''}</li>
                  )}
                  <li>• All question responses</li>
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
              'Delete Course'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
