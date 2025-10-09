import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MasteryData {
  mastered: number;
  activelyMastering: number;
  pending: number;
}

interface PacingMetrics {
  totalEstimatedMinutes: number;
  completedMinutes: number;
  progressPercentage: number;
  averageMinutesPerDay: number;
  projectedCompletionDate: Date | null;
  daysRemaining: number | null;
  onTrackStatus: 'ahead' | 'on-track' | 'behind' | 'unknown';
  recommendedDailyMinutes: number;
  masteryData: MasteryData;
  needsConfiguration: boolean;
  missingData: string[];
  framework?: string;
}

interface TimeBySubject {
  subject: string;
  minutes: number;
}

interface StandardsCoverage {
  covered: number;
  total: number;
  percentage: number;
}

export function useCoursePacing(courseId: string, targetDate?: Date) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PacingMetrics | null>(null);
  const [timeBySubject, setTimeBySubject] = useState<TimeBySubject[]>([]);
  const [standardsCoverage, setStandardsCoverage] = useState<StandardsCoverage | null>(null);

  useEffect(() => {
    if (courseId) {
      calculateMetrics();
    }
  }, [courseId, targetDate]);

  const calculateMetrics = async () => {
    try {
      setLoading(true);

      // Fetch course with curriculum items and pacing config
      const { data: course } = await supabase
        .from('courses')
        .select(`
          *,
          curriculum_items (
            id,
            est_minutes,
            standards,
            assignments (
              id,
              status,
              submissions (
                id,
                time_spent_seconds,
                student_id,
                question_responses (
                  is_correct,
                  time_spent_seconds
                )
              )
            )
          )
        `)
        .eq('id', courseId)
        .single();

      console.log('Course data:', course);

      if (!course) return;

      // Check for missing critical configuration
      const missingData: string[] = [];
      const needsConfiguration = 
        !course.standards_scope || 
        (Array.isArray(course.standards_scope) && course.standards_scope.length === 0) ||
        !course.grade_level ||
        !course.curriculum_items ||
        course.curriculum_items.length === 0;

      if (!course.standards_scope || (Array.isArray(course.standards_scope) && course.standards_scope.length === 0)) {
        missingData.push('Regional standards or learning framework');
      }
      if (!course.grade_level) {
        missingData.push('Grade level');
      }
      if (!course.curriculum_items || course.curriculum_items.length === 0) {
        missingData.push('Curriculum content and assignments');
      }

      // Calculate total estimated minutes
      const totalEstimatedMinutes = course.curriculum_items?.reduce(
        (sum: number, item: any) => sum + (item.est_minutes || 30),
        0
      ) || 0;

      // Calculate completed minutes from submissions
      let completedMinutes = 0;
      let correctAnswers = 0;
      let incorrectAnswers = 0;
      let unansweredQuestions = 0;

      course.curriculum_items?.forEach((item: any) => {
        item.assignments?.forEach((assignment: any) => {
          assignment.submissions?.forEach((submission: any) => {
            completedMinutes += (submission.time_spent_seconds || 0) / 60;
            
            submission.question_responses?.forEach((response: any) => {
              if (response.is_correct === true) correctAnswers++;
              else if (response.is_correct === false) incorrectAnswers++;
              else unansweredQuestions++;
            });
          });
        });
      });

      const totalQuestions = correctAnswers + incorrectAnswers + unansweredQuestions;
      
      // Calculate mastery percentages
      const masteryData: MasteryData = {
        mastered: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
        activelyMastering: totalQuestions > 0 ? (incorrectAnswers / totalQuestions) * 100 : 0,
        pending: totalQuestions > 0 ? (unansweredQuestions / totalQuestions) * 100 : 0
      };

      const progressPercentage = totalEstimatedMinutes > 0 
        ? Math.min((completedMinutes / totalEstimatedMinutes) * 100, 100)
        : 0;

      // Calculate average minutes per day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const assignmentIds = course.curriculum_items?.flatMap((ci: any) => 
        ci.assignments?.map((a: any) => a.id) || []
      ) || [];

      const { data: recentSubmissions } = await supabase
        .from('submissions')
        .select('time_spent_seconds, submitted_at')
        .gte('submitted_at', thirtyDaysAgo.toISOString())
        .in('assignment_id', assignmentIds);

      const recentMinutes = recentSubmissions?.reduce(
        (sum, s) => sum + (s.time_spent_seconds || 0) / 60,
        0
      ) || 0;

      // Use pacing_config if available, otherwise fall back to historical data
      let averageMinutesPerDay = recentMinutes / 30 || 0;
      
      // If pacing_config.weekly_minutes is set, use that as baseline
      const pacingConfig = course.pacing_config as any;
      if (pacingConfig?.weekly_minutes && pacingConfig.weekly_minutes > 0) {
        const configuredDailyMinutes = pacingConfig.weekly_minutes / 7;
        // Use configured value if we have no history, or take the average of both
        if (averageMinutesPerDay === 0) {
          averageMinutesPerDay = configuredDailyMinutes;
        } else {
          averageMinutesPerDay = (averageMinutesPerDay + configuredDailyMinutes) / 2;
        }
      }

      // Calculate projected completion
      const remainingMinutes = totalEstimatedMinutes - completedMinutes;
      let projectedCompletionDate: Date | null = null;
      let daysRemaining: number | null = null;

      if (averageMinutesPerDay > 0) {
        daysRemaining = Math.ceil(remainingMinutes / averageMinutesPerDay);
        projectedCompletionDate = new Date();
        projectedCompletionDate.setDate(projectedCompletionDate.getDate() + daysRemaining);
      }

      // Determine on-track status
      let onTrackStatus: 'ahead' | 'on-track' | 'behind' | 'unknown' = 'unknown';
      if (targetDate && projectedCompletionDate) {
        if (projectedCompletionDate < targetDate) {
          onTrackStatus = 'ahead';
        } else if (projectedCompletionDate.getTime() - targetDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
          onTrackStatus = 'on-track';
        } else {
          onTrackStatus = 'behind';
        }
      }

      // Calculate recommended daily minutes
      let recommendedDailyMinutes = averageMinutesPerDay;
      if (targetDate) {
        const daysUntilTarget = Math.max(1, Math.ceil((targetDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
        recommendedDailyMinutes = remainingMinutes / daysUntilTarget;
      }

      // Calculate standards coverage
      const allStandards = new Set(
        course.curriculum_items?.flatMap((item: any) => 
          Array.isArray(item.standards) ? item.standards : []
        ) || []
      );
      
      const coveredStandards = new Set(
        course.curriculum_items?.filter((item: any) => 
          item.assignments?.some((a: any) => 
            a.submissions?.length > 0 && a.status === 'graded'
          )
        ).flatMap((item: any) => 
          Array.isArray(item.standards) ? item.standards : []
        ) || []
      );

      const standardsCoverage: StandardsCoverage = {
        covered: coveredStandards.size,
        total: allStandards.size,
        percentage: allStandards.size > 0 ? (coveredStandards.size / allStandards.size) * 100 : 0
      };

      // Extract framework for display
      const framework = course.standards_scope?.[0]?.framework || null;

      setMetrics({
        totalEstimatedMinutes,
        completedMinutes,
        progressPercentage,
        averageMinutesPerDay,
        projectedCompletionDate,
        daysRemaining,
        onTrackStatus,
        recommendedDailyMinutes,
        masteryData,
        needsConfiguration,
        missingData,
        framework
      } as any);

      setStandardsCoverage(standardsCoverage);

      // Calculate time by subject (using course title as subject)
      setTimeBySubject([{
        subject: course.subject || course.title,
        minutes: completedMinutes
      }]);

    } catch (error) {
      console.error('Error calculating pacing metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    metrics,
    timeBySubject,
    standardsCoverage,
    refreshMetrics: calculateMetrics
  };
}
