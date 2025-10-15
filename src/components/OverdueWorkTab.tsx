import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, BookOpen, Clock, ChevronRight, X } from 'lucide-react';
import { parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { FocusJourneyDuck } from './FocusJourneyDuck';

interface OverdueWorkTabProps {
  studentId: string;
}

export function OverdueWorkTab({ studentId }: OverdueWorkTabProps) {
  const [loading, setLoading] = useState(true);
  const [overdueAssignments, setOverdueAssignments] = useState<any[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    fetchOverdueWork();
    
    // Check if banner was dismissed today
    const dismissedDate = localStorage.getItem('allCaughtUpBannerDismissed');
    const today = new Date().toDateString();
    if (dismissedDate === today) {
      setBannerDismissed(true);
    }
  }, [studentId]);

  const fetchOverdueWork = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all assignments with due dates before today that don't have complete submissions
      const { data: assignmentsData, error } = await supabase
        .from('assignments')
        .select(`
          *,
          curriculum_items (
            *,
            courses (
              id,
              title,
              subject
            )
          ),
          submissions (
            id,
            submitted_at
          )
        `)
        .lt('due_at', today)
        .eq('curriculum_items.courses.student_id', studentId)
        .order('due_at', { ascending: true });

      if (error) throw error;

      // Filter out assignments that have been submitted
      const overdue = (assignmentsData || []).filter(
        assignment => !assignment.submissions || assignment.submissions.length === 0
      );

      setOverdueAssignments(overdue);

    } catch (error: any) {
      console.error('Error fetching overdue work:', error);
      toast.error('Failed to load overdue assignments');
    } finally {
      setLoading(false);
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = parseISO(dueDate);
    return differenceInDays(new Date(), due);
  };

  const dismissBanner = () => {
    const today = new Date().toDateString();
    localStorage.setItem('allCaughtUpBannerDismissed', today);
    setBannerDismissed(true);
  };

  if (loading) {
    return (
      <Card className="mb-8">
        <CardContent className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (overdueAssignments.length === 0 && !bannerDismissed) {
    return (
      <div className="relative mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 shadow-lg animate-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-white hover:bg-white/20 z-10"
          onClick={dismissBanner}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="relative flex items-center gap-4">
          <div className="flex-shrink-0 scale-[1.8] ml-2">
            <FocusJourneyDuck 
              animationState="celebrating"
              onAnimationComplete={() => {}}
              onStateChange={() => {}}
            />
          </div>
          
          <div className="flex-1 text-white">
            <h3 className="font-bold text-xl mb-1 drop-shadow-sm">
              🎉 All Caught Up!
            </h3>
            <p className="text-white/90 text-base leading-relaxed">
              No overdue assignments. You're doing amazing — keep up the great work!
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (overdueAssignments.length === 0) {
    return null;
  }

  // Group by how overdue they are
  const groupedOverdue = {
    critical: overdueAssignments.filter(a => getDaysOverdue(a.due_at) > 7),
    warning: overdueAssignments.filter(a => getDaysOverdue(a.due_at) > 3 && getDaysOverdue(a.due_at) <= 7),
    recent: overdueAssignments.filter(a => getDaysOverdue(a.due_at) <= 3)
  };

  return (
    <div className="space-y-6 mb-8">
      <Card className="border-destructive bg-destructive/5">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <CardTitle className="text-destructive">
                {overdueAssignments.length} Overdue Assignment{overdueAssignments.length !== 1 ? 's' : ''}
              </CardTitle>
              <CardDescription>
                Let's work together to get caught up on these assignments
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {groupedOverdue.critical.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Urgent</Badge>
            <span className="text-sm text-muted-foreground">Over 1 week overdue</span>
          </div>
          {groupedOverdue.critical.map((assignment) => (
            <Card key={assignment.id} className="border-destructive">
              <CardContent className="p-4">
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => window.location.href = `/assignment/${assignment.id}`}
                >
                  <BookOpen className="h-5 w-5 mt-0.5 text-destructive" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium line-clamp-1">
                      {assignment.curriculum_items?.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {assignment.curriculum_items?.est_minutes || 30} min
                      </span>
                      <span className="text-destructive font-medium">
                        {getDaysOverdue(assignment.due_at)} days overdue
                      </span>
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {assignment.curriculum_items?.courses?.subject}
                    </Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {groupedOverdue.warning.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Needs Attention</Badge>
            <span className="text-sm text-muted-foreground">4-7 days overdue</span>
          </div>
          {groupedOverdue.warning.map((assignment) => (
            <Card key={assignment.id} className="border-orange-500/50">
              <CardContent className="p-4">
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => window.location.href = `/assignment/${assignment.id}`}
                >
                  <BookOpen className="h-5 w-5 mt-0.5 text-orange-500" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium line-clamp-1">
                      {assignment.curriculum_items?.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {assignment.curriculum_items?.est_minutes || 30} min
                      </span>
                      <span className="text-orange-500 font-medium">
                        {getDaysOverdue(assignment.due_at)} days overdue
                      </span>
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {assignment.curriculum_items?.courses?.subject}
                    </Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {groupedOverdue.recent.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Recently Overdue</Badge>
            <span className="text-sm text-muted-foreground">1-3 days overdue</span>
          </div>
          {groupedOverdue.recent.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="p-4">
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => window.location.href = `/assignment/${assignment.id}`}
                >
                  <BookOpen className="h-5 w-5 mt-0.5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium line-clamp-1">
                      {assignment.curriculum_items?.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {assignment.curriculum_items?.est_minutes || 30} min
                      </span>
                      <span className="font-medium">
                        {getDaysOverdue(assignment.due_at)} days overdue
                      </span>
                    </div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {assignment.curriculum_items?.courses?.subject}
                    </Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
