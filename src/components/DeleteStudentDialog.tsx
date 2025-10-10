import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Undo2 } from 'lucide-react';

interface DeleteStudentDialogProps {
  student: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentDeleted: () => void;
}

interface ImpactData {
  coursesCount: number;
  assignmentsCount: number;
  submissionsCount: number;
  gradesCount: number;
  xpEventsCount: number;
}

export const DeleteStudentDialog = ({ student, open, onOpenChange, onStudentDeleted }: DeleteStudentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);

  useEffect(() => {
    if (open && student) {
      loadImpactData();
    }
  }, [open, student]);

  const loadImpactData = async () => {
    setLoadingImpact(true);
    try {
      // Get courses count
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', student.id);

      // Get curriculum items for this student's courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('student_id', student.id);

      let assignmentsCount = 0;
      let submissionsCount = 0;
      let gradesCount = 0;

      if (courses && courses.length > 0) {
        const courseIds = courses.map(c => c.id);

        // Get curriculum items
        const { data: curriculumItems } = await supabase
          .from('curriculum_items')
          .select('id')
          .in('course_id', courseIds);

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
      }

      // Get XP events count
      const { count: xpEventsCount } = await supabase
        .from('xp_events')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', student.id);

      setImpactData({
        coursesCount: coursesCount || 0,
        assignmentsCount,
        submissionsCount,
        gradesCount,
        xpEventsCount: xpEventsCount || 0,
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
      const backup: any = { student };

      // Get courses
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('student_id', student.id);
      backup.courses = courses;

      // Get all related data
      if (courses && courses.length > 0) {
        const courseIds = courses.map((c: any) => c.id);

        // Get curriculum items
        const { data: curriculumItems } = await supabase
          .from('curriculum_items')
          .select('*')
          .in('course_id', courseIds);
        backup.curriculumItems = curriculumItems;

        if (curriculumItems && curriculumItems.length > 0) {
          const curriculumItemIds = curriculumItems.map((ci: any) => ci.id);

          // Get assignments
          const { data: assignments } = await supabase
            .from('assignments')
            .select('*')
            .in('curriculum_item_id', curriculumItemIds);
          backup.assignments = assignments;

          if (assignments && assignments.length > 0) {
            const assignmentIds = assignments.map((a: any) => a.id);

            // Get submissions
            const { data: submissions } = await supabase
              .from('submissions')
              .select('*')
              .in('assignment_id', assignmentIds);
            backup.submissions = submissions;

            // Get grades
            const { data: grades } = await supabase
              .from('grades')
              .select('*')
              .in('assignment_id', assignmentIds);
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
          }
        }

        // Get progress gaps
        const { data: progressGaps } = await supabase
          .from('progress_gaps')
          .select('*')
          .in('course_id', courseIds);
        backup.progressGaps = progressGaps;
      }

      // Get XP events
      const { data: xpEvents } = await supabase
        .from('xp_events')
        .select('*')
        .eq('student_id', student.id);
      backup.xpEvents = xpEvents;

      // Now delete the student (cascade will handle related data due to trigger)
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

      if (error) throw error;

      // Show success toast with undo button
      const toastId = toast.success(
        `${student.name} deleted successfully`,
        {
          duration: 30000, // 30 seconds
          action: {
            label: <div className="flex items-center gap-1"><Undo2 className="h-3 w-3" /> Undo</div>,
            onClick: async () => {
              await restoreStudent(backup);
              toast.dismiss(toastId);
            },
          },
        }
      );

      onOpenChange(false);
      onStudentDeleted();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error(error.message || 'Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  const restoreStudent = async (backup: any) => {
    try {
      toast.info('Restoring student data...');

      // Restore student
      const { error: studentError } = await supabase
        .from('students')
        .insert([backup.student]);
      if (studentError) throw studentError;

      // Restore courses
      if (backup.courses && backup.courses.length > 0) {
        await supabase.from('courses').insert(backup.courses);
      }

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

      // Restore XP events
      if (backup.xpEvents && backup.xpEvents.length > 0) {
        await supabase.from('xp_events').insert(backup.xpEvents);
      }

      toast.success('Student restored successfully');
      onStudentDeleted(); // Refresh the list
    } catch (error: any) {
      console.error('Error restoring student:', error);
      toast.error('Failed to restore student. Please contact support.');
    }
  };

  if (!student) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Delete Student</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="font-medium text-foreground">
              Are you sure you want to delete <strong>{student.name}</strong>?
            </p>
            
            {loadingImpact ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : impactData ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">This will permanently delete:</p>
                <ul className="text-sm space-y-1">
                  {impactData.coursesCount > 0 && (
                    <li>• {impactData.coursesCount} course{impactData.coursesCount !== 1 ? 's' : ''}</li>
                  )}
                  {impactData.assignmentsCount > 0 && (
                    <li>• {impactData.assignmentsCount} assignment{impactData.assignmentsCount !== 1 ? 's' : ''}</li>
                  )}
                  {impactData.submissionsCount > 0 && (
                    <li>• {impactData.submissionsCount} submission{impactData.submissionsCount !== 1 ? 's' : ''}</li>
                  )}
                  {impactData.gradesCount > 0 && (
                    <li>• {impactData.gradesCount} grade{impactData.gradesCount !== 1 ? 's' : ''}</li>
                  )}
                  {impactData.xpEventsCount > 0 && (
                    <li>• {impactData.xpEventsCount} XP event{impactData.xpEventsCount !== 1 ? 's' : ''}</li>
                  )}
                  <li>• All progress tracking data</li>
                  <li>• All learning profile settings</li>
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={backupAndDelete}
            disabled={loading || loadingImpact}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Student'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
