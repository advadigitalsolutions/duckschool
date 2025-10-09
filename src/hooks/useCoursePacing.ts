import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MasteryData {
  mastered: number;
  activelyMastering: number;
  pending: number;
}

interface PacingMetrics {
  totalMinutes: number;
  curriculumCreatedMinutes: number;
  completedMinutes: number;
  progressPercentage: number;
  curriculumCoveragePercentage: number;
  averageMinutesPerDay: number;
  projectedCompletionDate: Date | null;
  daysRemaining: number | null;
  onTrackStatus: 'ahead' | 'on-track' | 'behind' | 'unknown';
  recommendedDailyMinutes: number;
  masteryData: MasteryData;
  needsConfiguration: boolean;
  needsMoreCurriculum: boolean;
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

      if (!course) return;

      // Calculate total estimated minutes in created curriculum (needed early)
      const curriculumCreatedMinutes = course.curriculum_items?.reduce(
        (sum: number, item: any) => sum + (item.est_minutes || 30),
        0
      ) || 0;

      // Fetch all standards for this course to calculate total required hours
      const pacingConfig = course.pacing_config as any;
      const courseFramework = course.standards_scope?.[0]?.framework || pacingConfig?.framework || 'CA-CCSS';
      const isCustomFramework = courseFramework === 'CUSTOM';
      
      // Normalize subject names for flexible matching
      const subjectVariations = [
        course.subject,
        course.subject.replace(/\//g, ' '), // "English/Language Arts" -> "English Language Arts"
        course.subject.replace(/ /g, '/'),   // "English Language Arts" -> "English/Language Arts"
      ];
      
      // Try to find standards with flexible subject and grade matching
      let standards = null;
      for (const subjectVariant of subjectVariations) {
        const { data } = await supabase
          .from('standards')
          .select('*')
          .eq('framework', courseFramework)
          .eq('subject', subjectVariant)
          .eq('grade_band', course.grade_level);
        
        if (data && data.length > 0) {
          standards = data;
          break;
        }
      }
      
      // If no exact grade match, try grade ranges that include this grade
      if (!standards || standards.length === 0) {
        const gradeNum = parseInt(course.grade_level) || 12;
        for (const subjectVariant of subjectVariations) {
          const { data } = await supabase
            .from('standards')
            .select('*')
            .eq('framework', courseFramework)
            .eq('subject', subjectVariant);
          
          if (data && data.length > 0) {
            // Filter for grade ranges that include our grade
            const filtered = data.filter((s: any) => {
              const gradeBand = s.grade_band;
              if (gradeBand.includes('-')) {
                const [start, end] = gradeBand.split('-').map((g: string) => parseInt(g));
                return gradeNum >= start && gradeNum <= end;
              }
              return parseInt(gradeBand) === gradeNum;
            });
            
            if (filtered.length > 0) {
              standards = filtered;
              break;
            }
          }
        }
      }

      // Calculate total required minutes from standards
      const totalRequiredMinutes = (standards || []).reduce((sum, standard) => {
        const metadata = standard.metadata as any;
        const estimatedHours = metadata?.estimated_hours || 0;
        return sum + (estimatedHours * 60);
      }, 0);

      // Check for missing critical configuration
      const missingData: string[] = [];
      const hasStandards = (standards || []).length > 0;
      
      // Custom framework is valid without standards if goals are set
      const hasGoals = course.goals && course.goals.trim().length > 0;
      const needsConfiguration = isCustomFramework 
        ? (!hasGoals || !course.grade_level)
        : (!hasStandards || !course.grade_level);

      if (isCustomFramework && !hasGoals) {
        missingData.push('Custom framework requires course goals to be configured');
      } else if (!isCustomFramework && !hasStandards) {
        missingData.push(`No ${courseFramework} standards available for ${course.subject} at grade ${course.grade_level}`);
      }
      
      if (!course.grade_level) {
        missingData.push('Grade level');
      }
      
      // Use curriculum-based calculation if no standards available
      const fallbackTotalMinutes = !hasStandards && curriculumCreatedMinutes > 0 
        ? curriculumCreatedMinutes 
        : totalRequiredMinutes;

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

      // Use fallback total for calculations if no standards
      const effectiveTotalMinutes = fallbackTotalMinutes || totalRequiredMinutes;

      // Calculate progress percentage based on required hours
      const progressPercentage = effectiveTotalMinutes > 0 
        ? Math.min((completedMinutes / effectiveTotalMinutes) * 100, 100)
        : curriculumCreatedMinutes > 0 
          ? Math.min((completedMinutes / curriculumCreatedMinutes) * 100, 100)
          : 0;

      // Calculate curriculum creation percentage
      const curriculumCoveragePercentage = effectiveTotalMinutes > 0
        ? Math.min((curriculumCreatedMinutes / effectiveTotalMinutes) * 100, 100)
        : 100; // If no standards, show 100% if any curriculum exists

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
      if (pacingConfig?.weekly_minutes && pacingConfig.weekly_minutes > 0) {
        const configuredDailyMinutes = pacingConfig.weekly_minutes / 7;
        // Use configured value if we have no history, or take the average of both
        if (averageMinutesPerDay === 0) {
          averageMinutesPerDay = configuredDailyMinutes;
        } else {
          averageMinutesPerDay = (averageMinutesPerDay + configuredDailyMinutes) / 2;
        }
      }

      // Calculate projected completion based on required hours
      const remainingMinutes = effectiveTotalMinutes - completedMinutes;
      let projectedCompletionDate: Date | null = null;
      let daysRemaining: number | null = null;

      if (averageMinutesPerDay > 0 && remainingMinutes > 0) {
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

      // Calculate recommended daily minutes to complete all required hours
      let recommendedDailyMinutes = averageMinutesPerDay;
      if (targetDate) {
        const daysUntilTarget = Math.max(1, Math.ceil((targetDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
        recommendedDailyMinutes = remainingMinutes / daysUntilTarget;
      }

      // Check if curriculum creation is keeping pace
      const needsMoreCurriculum = curriculumCreatedMinutes < (completedMinutes + (recommendedDailyMinutes * 7));

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

      setMetrics({
        totalMinutes: effectiveTotalMinutes || curriculumCreatedMinutes,
        curriculumCreatedMinutes,
        completedMinutes,
        progressPercentage,
        curriculumCoveragePercentage,
        averageMinutesPerDay,
        projectedCompletionDate,
        daysRemaining,
        onTrackStatus,
        recommendedDailyMinutes,
        masteryData,
        needsConfiguration,
        needsMoreCurriculum,
        missingData,
        framework: courseFramework
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
