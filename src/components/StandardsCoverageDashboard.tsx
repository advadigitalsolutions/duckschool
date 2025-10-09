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
  grade_band: string;
  covered: boolean;
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
      // Get all relevant standards for this course
      let query = supabase
        .from('standards')
        .select('code, text, grade_band')
        .eq('framework', framework);

      if (subject) {
        query = query.eq('subject', subject);
      }

      if (gradeLevel) {
        const gradeNum = parseInt(gradeLevel.replace(/\D/g, ''));
        if (!isNaN(gradeNum)) {
          query = query.or(`grade_band.eq.${gradeNum},grade_band.like.%${gradeNum}%`);
        }
      }

      const { data: standardsData, error: standardsError } = await query;
      if (standardsError) throw standardsError;

      // Get curriculum items with their standards and check if they have graded assignments
      const { data: curriculumData, error: curriculumError } = await supabase
        .from('curriculum_items')
        .select(`
          standards,
          assignments (
            status,
            submissions (
              id
            )
          )
        `)
        .eq('course_id', courseId);

      if (curriculumError) throw curriculumError;

      // Determine which standards have been covered (assignments with submissions that are graded)
      const covered = new Set<string>();
      curriculumData?.forEach(item => {
        const hasCompletedWork = item.assignments?.some(
          a => a.status === 'graded' && a.submissions && a.submissions.length > 0
        );
        
        if (hasCompletedWork && Array.isArray(item.standards)) {
          item.standards.forEach(code => {
            if (typeof code === 'string') {
              covered.add(code);
            }
          });
        }
      });

      setCoveredStandards(covered);
      setAllStandards(
        standardsData?.map(s => ({
          ...s,
          covered: covered.has(s.code)
        })) || []
      );
    } catch (error) {
      console.error('Error loading standards coverage:', error);
    } finally {
      setLoading(false);
    }
  };

  const coveredCount = allStandards.filter(s => s.covered).length;
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
          <CardDescription>No standards found for this configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground p-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Configure your course framework to track standards coverage</p>
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
                          {standard.grade_band && (
                            <Badge variant="outline" className="mt-2">
                              Grade {standard.grade_band}
                            </Badge>
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
                            {standard.grade_band && (
                              <Badge variant="outline" className="mt-2">
                                Grade {standard.grade_band}
                              </Badge>
                            )}
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
