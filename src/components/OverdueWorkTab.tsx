import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, BookOpen, Clock, ChevronRight, X, Zap } from 'lucide-react';
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

  // Calculate totals for motivation
  const totalMinutes = overdueAssignments.reduce((sum, a) => sum + (a.curriculum_items?.est_minutes || 30), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const estimatedXP = overdueAssignments.length * 50; // Approximate XP per assignment

  // Group by how overdue they are
  const groupedOverdue = {
    critical: overdueAssignments.filter(a => getDaysOverdue(a.due_at) > 7),
    warning: overdueAssignments.filter(a => getDaysOverdue(a.due_at) > 3 && getDaysOverdue(a.due_at) <= 7),
    recent: overdueAssignments.filter(a => getDaysOverdue(a.due_at) <= 3)
  };

  return (
    <div className="space-y-6 mb-8">
      <Card className="border-amber-400/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 shadow-lg">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Target className="h-6 w-6 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <CardTitle className="text-amber-900 dark:text-amber-100 text-lg">
                {overdueAssignments.length} Assignment{overdueAssignments.length !== 1 ? 's' : ''} Need Your Attention
              </CardTitle>
              <CardDescription className="text-amber-700 dark:text-amber-300 mt-1.5">
                You've got this! Let's tackle these together — small steps lead to big wins 🎯
              </CardDescription>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <Clock className="h-4 w-4" />
                  About {totalHours > 0 && `${totalHours}h `}{remainingMinutes}m total
                </span>
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium">
                  <Zap className="h-4 w-4" />
                  Earn up to {estimatedXP} XP!
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {groupedOverdue.critical.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500 text-white hover:bg-amber-600 border-0">Priority</Badge>
            <span className="text-sm text-muted-foreground">Let's focus here first</span>
          </div>
          {groupedOverdue.critical.map((assignment) => (
            <Card key={assignment.id} className="border-amber-300 dark:border-amber-700 hover:shadow-lg transition-all duration-200 hover:border-amber-400 dark:hover:border-amber-600">
              <CardContent className="p-5">
                <div
                  className="flex items-start gap-4 cursor-pointer group"
                  onClick={() => window.location.href = `/assignment/${assignment.id}`}
                >
                  <BookOpen className="h-5 w-5 mt-0.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold line-clamp-1 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                      {assignment.curriculum_items?.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {assignment.curriculum_items?.est_minutes || 30} min
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {getDaysOverdue(assignment.due_at)} days behind
                      </span>
                    </div>
                    <Badge variant="outline" className="mt-2.5 text-xs">
                      {assignment.curriculum_items?.courses?.subject}
                    </Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {groupedOverdue.warning.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-sky-500 text-white hover:bg-sky-600 border-0">Focus On These</Badge>
            <span className="text-sm text-muted-foreground">Getting close to a week</span>
          </div>
          {groupedOverdue.warning.map((assignment) => (
            <Card key={assignment.id} className="border-sky-300 dark:border-sky-700 hover:shadow-lg transition-all duration-200 hover:border-sky-400 dark:hover:border-sky-600">
              <CardContent className="p-5">
                <div
                  className="flex items-start gap-4 cursor-pointer group"
                  onClick={() => window.location.href = `/assignment/${assignment.id}`}
                >
                  <BookOpen className="h-5 w-5 mt-0.5 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold line-clamp-1 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                      {assignment.curriculum_items?.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {assignment.curriculum_items?.est_minutes || 30} min
                      </span>
                      <span className="text-sky-600 dark:text-sky-400 font-medium">
                        {getDaysOverdue(assignment.due_at)} days behind
                      </span>
                    </div>
                    <Badge variant="outline" className="mt-2.5 text-xs">
                      {assignment.curriculum_items?.courses?.subject}
                    </Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {groupedOverdue.recent.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500 text-white hover:bg-purple-600 border-0">Quick Wins</Badge>
            <span className="text-sm text-muted-foreground">Perfect for getting back on track!</span>
          </div>
          {groupedOverdue.recent.map((assignment) => (
            <Card key={assignment.id} className="border-purple-300 dark:border-purple-700 hover:shadow-lg transition-all duration-200 hover:border-purple-400 dark:hover:border-purple-600">
              <CardContent className="p-5">
                <div
                  className="flex items-start gap-4 cursor-pointer group"
                  onClick={() => window.location.href = `/assignment/${assignment.id}`}
                >
                  <BookOpen className="h-5 w-5 mt-0.5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold line-clamp-1 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                      {assignment.curriculum_items?.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {assignment.curriculum_items?.est_minutes || 30} min
                      </span>
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        {getDaysOverdue(assignment.due_at)} day{getDaysOverdue(assignment.due_at) !== 1 ? 's' : ''} behind
                      </span>
                    </div>
                    <Badge variant="outline" className="mt-2.5 text-xs">
                      {assignment.curriculum_items?.courses?.subject}
                    </Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
