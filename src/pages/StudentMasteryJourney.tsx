import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp, Target, Award, Brain, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function StudentMasteryJourney() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentId();
  }, []);

  const fetchStudentId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentData) {
        setStudentId(studentData.id);
      }
    } catch (error) {
      console.error('Error fetching student ID:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch mastery data
  const { data: masteryData } = useQuery({
    queryKey: ['mastery-summary', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data } = await supabase
        .from('course_mastery_summary')
        .select(`
          *,
          courses (
            title,
            subject
          )
        `)
        .eq('student_id', studentId);
      return data;
    },
    enabled: !!studentId,
  });

  // Fetch growth opportunities (weak standards)
  const { data: growthOpportunities } = useQuery({
    queryKey: ['growth-opportunities', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data } = await supabase
        .from('standard_mastery')
        .select('*')
        .eq('student_id', studentId)
        .lt('mastery_level', 60)
        .order('last_attempted_at', { ascending: false })
        .limit(8);
      return data;
    },
    enabled: !!studentId,
  });

  // Fetch badges
  const { data: badges } = useQuery({
    queryKey: ['badges', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data } = await supabase
        .from('student_badges')
        .select('*')
        .eq('student_id', studentId)
        .order('earned_at', { ascending: false });
      return data;
    },
    enabled: !!studentId,
  });

  // Calculate overall progress
  const overallMastery = masteryData?.reduce((acc, course) => {
    return acc + (course.overall_mastery_percentage || 0);
  }, 0) / (masteryData?.length || 1);

  const totalStandardsMastered = masteryData?.reduce((acc, course) => {
    return acc + (course.standards_mastered || 0);
  }, 0) || 0;

  const totalStandards = masteryData?.reduce((acc, course) => {
    return acc + (course.total_standards || 0);
  }, 0) || 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 via-accent/10 to-background border border-primary/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Your Mastery Journey</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Every challenge you take helps us understand how you learn best. The more gaps we discover, 
            the better we can tailor your learning experience. You're not being tested—you're being understood.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Standards Mastered</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStandardsMastered}</div>
            <p className="text-xs text-muted-foreground mt-1">
              out of {totalStandards} total
            </p>
            <Progress value={(totalStandardsMastered / totalStandards) * 100} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Growth Opportunities</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{growthOpportunities?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              areas ready for your focus
            </p>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Achievement Badges</CardTitle>
            <Award className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{badges?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              earned for courage & growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="growth" className="gap-2">
            <Brain className="h-4 w-4" />
            Growth Areas
          </TabsTrigger>
          <TabsTrigger value="mastery" className="gap-2">
            <Zap className="h-4 w-4" />
            Mastery Progress
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-2">
            <Award className="h-4 w-4" />
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Your Learning Edge
              </CardTitle>
              <CardDescription>
                These are your growth opportunities. Each one is a chance to level up your understanding!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {growthOpportunities && growthOpportunities.length > 0 ? (
                growthOpportunities.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{opportunity.standard_code}</div>
                      <div className="text-sm text-muted-foreground">
                        {opportunity.total_attempts} {opportunity.total_attempts === 1 ? 'attempt' : 'attempts'} so far
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-accent">
                          {Math.round(opportunity.mastery_level)}%
                        </div>
                        <div className="text-xs text-muted-foreground">current</div>
                      </div>
                      <Badge variant="outline" className="bg-background">
                        🌱 Growing
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Great work! Take some assessments to discover new growth opportunities.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mastery" className="space-y-4">
          {masteryData && masteryData.length > 0 ? (
            masteryData.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{course.courses?.title}</CardTitle>
                      <CardDescription>{course.courses?.subject}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{Math.round(course.overall_mastery_percentage || 0)}%</div>
                      <div className="text-sm text-muted-foreground">mastery</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={course.overall_mastery_percentage || 0} className="h-2" />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-500">{course.standards_mastered}</div>
                      <div className="text-xs text-muted-foreground">Mastered</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-500">{course.standards_in_progress}</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-500">{course.standards_not_started}</div>
                      <div className="text-xs text-muted-foreground">Upcoming</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Start your courses to see your mastery progress!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-secondary" />
                Your Achievements
              </CardTitle>
              <CardDescription>
                Earned for having the courage to challenge yourself and discover how you learn best
              </CardDescription>
            </CardHeader>
            <CardContent>
              {badges && badges.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="text-3xl">{badge.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium">{badge.badge_name}</div>
                        <div className="text-sm text-muted-foreground">{badge.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(badge.earned_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Complete assessments to earn your first achievement badge!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
