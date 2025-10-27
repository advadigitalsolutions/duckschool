import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface Standard {
  code: string;
  text: string;
  grade_band: string | null;
  covered: boolean;
  estimatedHours: number;
  curriculumHours: number;
  completedHours: number;
}

interface StandardsCoverageDashboardProps {
  courseId: string;
  framework: string;
  gradeLevel: string;
  subject: string;
}

export function StandardsCoverageDashboard({ 
  courseId, 
  framework, 
  gradeLevel,
  subject 
}: StandardsCoverageDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [allStandards, setAllStandards] = useState<Standard[]>([]);
  const [coveredStandards, setCoveredStandards] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadStandardsCoverage();
  }, [courseId, framework, gradeLevel, subject]);

  const loadStandardsCoverage = async () => {
    setLoading(true);
    try {
      // First, check if this is a bridge course by getting course details
      const { data: courseData } = await supabase
        .from('courses')
        .select('course_type, standards_scope')
        .eq('id', courseId)
        .single();
      
      const isBridgeMode = courseData?.course_type === 'bridge_mode' || 
                           courseData?.standards_scope?.[0]?.bridge_mode === true;
      
      console.log('🔍 Course type:', courseData?.course_type, 'Bridge mode:', isBridgeMode);
      
      let standardsData: any[] = [];
      
      if (isBridgeMode) {
        // For bridge courses, get standards from curriculum items first
        const { data: curriculumItems } = await supabase
          .from('curriculum_items')
          .select('standards')
          .eq('course_id', courseId);
        
        const standardCodesInCourse = new Set<string>();
        curriculumItems?.forEach(item => {
          const codes = Array.isArray(item.standards) ? item.standards : [];
          codes.forEach((code: string) => {
            if (!code.startsWith('DIAGNOSTIC:')) {
              standardCodesInCourse.add(code);
            }
          });
        });
        
        console.log('📚 Bridge course standards:', Array.from(standardCodesInCourse));
        
        // Query details for these specific standards
        if (standardCodesInCourse.size > 0) {
          const { data } = await supabase
            .from('standards')
            .select('code, text, grade_band, metadata')
            .in('code', Array.from(standardCodesInCourse));
          
          standardsData = data || [];
          console.log('📊 Found details for', standardsData.length, 'bridge standards');
        }
      } else {
        // Original logic for non-bridge courses
        // Normalize framework names - handle both "CA-CCSS" and "CA CCSS" formats
        const frameworkVariations = [
          framework,
          framework?.replace(/-/g, ' '), // "CA-CCSS" -> "CA CCSS"
          framework?.replace(/ /g, '-'), // "CA CCSS" -> "CA-CCSS"
        ].filter(Boolean);

        // Normalize subject names
        const subjectVariations = subject ? [
          subject,
          subject.replace(/\//g, ' '), // "English/Language Arts" -> "English Language Arts"
          subject.replace(/ /g, '/'),   // "English Language Arts" -> "English/Language Arts"
        ] : [];

        console.log('🔍 StandardsCoverageDashboard query:', { framework, frameworkVariations, subject, subjectVariations, gradeLevel });
        
        // Try all framework and subject combinations
        for (const frameworkVariant of frameworkVariations) {
          for (const subjectVariant of (subjectVariations.length > 0 ? subjectVariations : [null])) {
            let query = supabase
              .from('standards')
              .select('code, text, grade_band, metadata')
              .eq('framework', frameworkVariant);

            if (subjectVariant) {
              query = query.eq('subject', subjectVariant);
            }

            if (gradeLevel) {
              const gradeNum = parseInt(gradeLevel.replace(/\D/g, ''));
              if (!isNaN(gradeNum)) {
                // Match exact grade or grade ranges that include this grade
                query = query.or(`grade_band.eq.${gradeNum},grade_band.eq.K-${gradeNum},grade_band.like.%-${gradeNum},grade_band.like.K-12`);
              }
            }

            const { data, error } = await query;
            if (error) {
              console.error('StandardsCoverageDashboard error:', error);
            }
            
            if (data && data.length > 0) {
              standardsData = data;
              console.log('📊 StandardsCoverageDashboard found:', data.length, 'standards with', { frameworkVariant, subjectVariant });
              break;
            }
          }
          if (standardsData.length > 0) break;
        }

        if (standardsData.length === 0) {
          console.log('⚠️ No standards found for any combination');
        }
      }

      // Get curriculum items with their standards, estimated minutes, and check completion
      const { data: curriculumData, error: curriculumError } = await supabase
        .from('curriculum_items')
        .select(`
          id,
          standards,
          est_minutes,
          assignments (
            id,
            status,
            submissions (
              id,
              student_id,
              time_spent_seconds,
              grades (score)
            )
          )
        `)
        .eq('course_id', courseId);

      if (curriculumError) throw curriculumError;

      // Calculate hours per standard
      const standardsMap = new Map<string, {
        estimatedHours: number;
        curriculumMinutes: number;
        completedMinutes: number;
        covered: boolean;
      }>();

      // Initialize from standards table
      standardsData?.forEach(s => {
        standardsMap.set(s.code, {
          estimatedHours: (s as any).metadata?.estimated_hours || 0,
          curriculumMinutes: 0,
          completedMinutes: 0,
          covered: false,
        });
      });

      // Accumulate curriculum and completion data
      curriculumData?.forEach(item => {
        const standardCodes = Array.isArray(item.standards) 
          ? item.standards 
          : typeof item.standards === 'string'
          ? [item.standards]
          : [];
        
        const hasGradedSubmissions = item.assignments?.some(
          (a: any) => a.submissions?.some((s: any) => s.grades?.length > 0)
        );

        const itemMinutes = item.est_minutes || 0;
        const completedMinutes = item.assignments?.reduce((sum: number, a: any) => {
          return sum + (a.submissions?.reduce((s: number, sub: any) => 
            s + ((sub.time_spent_seconds || 0) / 60), 0) || 0);
        }, 0) || 0;

        standardCodes.forEach((code: string) => {
          const existing = standardsMap.get(code);
          if (existing) {
            existing.curriculumMinutes += itemMinutes;
            existing.completedMinutes += completedMinutes;
            if (hasGradedSubmissions) {
              existing.covered = true;
            }
          }
        });
      });

      // Map to final format
      const mappedStandards = standardsData?.map(s => {
        const data = standardsMap.get(s.code) || {
          estimatedHours: 0,
          curriculumMinutes: 0,
          completedMinutes: 0,
          covered: false,
        };
        return {
          code: s.code,
          text: s.text,
          grade_band: s.grade_band,
          covered: data.covered,
          estimatedHours: data.estimatedHours,
          curriculumHours: data.curriculumMinutes / 60,
          completedHours: data.completedMinutes / 60,
        };
      }) || [];

      setAllStandards(mappedStandards);
      setCoveredStandards(new Set(mappedStandards.filter(s => s.covered).map(s => s.code)));
    } catch (error) {
      console.error('Error loading standards coverage:', error);
    } finally {
      setLoading(false);
    }
  };

  const coveredCount = coveredStandards.size;
  const totalCount = allStandards.length;
  const coveragePercentage = totalCount > 0 ? (coveredCount / totalCount) * 100 : 0;
  const pendingStandards = allStandards.filter(s => !s.covered);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Standards Coverage</CardTitle>
          <CardDescription>
            {framework && subject && gradeLevel
              ? `No ${framework} standards found for ${subject} at grade ${gradeLevel}`
              : 'No standards found for this configuration'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground p-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <div className="space-y-2">
              <p className="font-semibold">Why am I seeing this?</p>
              <p className="text-sm">The standards database may not have detailed standards for this specific combination.</p>
              <p className="text-sm">Generate curriculum to track progress based on what you create.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standards Coverage Tracking</CardTitle>
        <CardDescription>
          {framework} standards for grade {gradeLevel} {subject}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="font-bold">
              {coveredCount} of {totalCount} standards ({coveragePercentage.toFixed(1)}%)
            </span>
          </div>
          <Progress value={coveragePercentage} className="h-3" />
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              {coveredCount} Covered
            </span>
            <span className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-muted-foreground" />
              {pendingStandards.length} Pending
            </span>
          </div>
        </div>

        {/* Standards Lists */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">
              Pending ({pendingStandards.length})
            </TabsTrigger>
            <TabsTrigger value="covered">
              Covered ({coveredCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <ScrollArea className="h-[400px] mt-4">
              <div className="space-y-2 pr-4">
                {pendingStandards.length === 0 ? (
                  <div className="text-center text-muted-foreground p-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>All standards covered! 🎉</p>
                  </div>
                ) : (
                  pendingStandards.map((standard) => (
                    <div
                      key={standard.code}
                      className="p-3 rounded-lg border bg-card"
                    >
                        <div className="flex items-start gap-2">
                          <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm font-medium text-primary">
                              {standard.code}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {standard.text}
                            </div>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              {standard.grade_band && (
                                <span>Grade: {standard.grade_band}</span>
                              )}
                              <span>Required: {standard.estimatedHours}h</span>
                              <span>Created: {standard.curriculumHours.toFixed(1)}h</span>
                              {standard.completedHours > 0 && (
                                <span className="text-primary">Completed: {standard.completedHours.toFixed(1)}h</span>
                              )}
                            </div>
                            {standard.curriculumHours === 0 && (
                              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                                ⚠️ No curriculum created yet
                              </p>
                            )}
                            {standard.curriculumHours > 0 && standard.curriculumHours < standard.estimatedHours && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Need {(standard.estimatedHours - standard.curriculumHours).toFixed(1)}h more curriculum
                              </p>
                            )}
                          </div>
                        </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="covered">
            <ScrollArea className="h-[400px] mt-4">
              <div className="space-y-2 pr-4">
                {coveredCount === 0 ? (
                  <div className="text-center text-muted-foreground p-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No standards covered yet</p>
                  </div>
                ) : (
                  allStandards
                    .filter(s => s.covered)
                    .map((standard) => (
                      <div
                        key={standard.code}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm font-medium text-primary">
                              {standard.code}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {standard.text}
                            </div>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              {standard.grade_band && (
                                <span>Grade: {standard.grade_band}</span>
                              )}
                              <span>Required: {standard.estimatedHours}h</span>
                              <span>Created: {standard.curriculumHours.toFixed(1)}h</span>
                              <span className="text-primary">Completed: {standard.completedHours.toFixed(1)}h</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
