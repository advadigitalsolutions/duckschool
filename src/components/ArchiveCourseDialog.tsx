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
import { Archive, ArchiveRestore } from 'lucide-react';

interface ArchiveCourseDialogProps {
  course: any;
  onCourseUpdated: () => void;
  trigger?: React.ReactNode;
}

export function ArchiveCourseDialog({ course, onCourseUpdated, trigger }: ArchiveCourseDialogProps) {
  const [loading, setLoading] = useState(false);
  const isArchived = course.archived;

  const handleArchiveToggle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({ archived: !isArchived })
        .eq('id', course.id);

      if (error) throw error;

      toast.success(isArchived ? 'Course restored successfully' : 'Course archived successfully');
      onCourseUpdated();
    } catch (error: any) {
      toast.error(`Failed to ${isArchived ? 'restore' : 'archive'} course`);
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
            {isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4 mr-2" />
                Restore
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </>
            )}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isArchived ? 'Restore Course?' : 'Archive Course?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isArchived ? (
              <p>
                This will restore "{course.title}" and make it visible in the active courses list again.
              </p>
            ) : (
              <>
                <p>
                  This will archive "{course.title}" and hide it from the active courses list.
                </p>
                <p className="mt-2">
                  All course data will be preserved and you can restore it at any time. Students will no longer see this course or its assignments.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleArchiveToggle} disabled={loading}>
            {loading ? 'Processing...' : (isArchived ? 'Restore Course' : 'Archive Course')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
