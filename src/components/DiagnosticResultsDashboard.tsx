import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DiagnosticResults {
  totalQuestions: number;
  correctAnswers: number;
  accuracyRate: number;
  averageMastery: number;
  masteredTopics?: string[];
  strugglingTopics?: string[];
  knowledgeBoundaries?: string[];
  masteryByTopic?: Record<string, {
    mastery: number;
    attempts: number;
    successes: number;
    prerequisite?: string;
  }>;
  topicBreakdown?: {
    strengths: Array<{ topic: string; mastery: number }>;
    growing: Array<{ topic: string; mastery: number }>;
    needsWork: Array<{ topic: string; mastery: number }>;
  };
}

interface DiagnosticResultsDashboardProps {
  assessmentId: string;
  results: DiagnosticResults;
  subject: string;
  studentId: string;
}

export function DiagnosticResultsDashboard({ 
  assessmentId, 
  results, 
  subject,
  studentId 
}: DiagnosticResultsDashboardProps) {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreateBridgeCourse = async () => {
    setIsGenerating(true);
    
    try {
      // Call edge function to create bridge course
      const { data, error } = await supabase.functions.invoke('create-bridge-course', {
        body: { 
          assessmentId,
          studentId,
          courseTitle: `${subject} Foundations`
        }
      });

      if (error) throw error;

      if (!data.shouldCreateCourse === false) {
        toast({
          title: "No Gaps Found",
          description: "Great news! No foundational gaps were identified. You're ready for grade-level work!",
        });
        navigate('/student/dashboard');
        return;
      }

      toast({
        title: "Bridge Course Created!",
        description: `Created "${data.courseName}" covering ${data.standardsCovered} foundational standards across ${data.topicAreas.length} topic areas.`,
      });

      // Navigate to the new course
      navigate(`/course/${data.courseId}`);
    } catch (error) {
      console.error('Error creating bridge course:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create bridge course. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Section */}
      <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="text-center pb-3">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Assessment Complete!</CardTitle>
          <CardDescription className="text-base">
            You've done an amazing job! Here's what we discovered about your knowledge.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-3xl font-bold text-primary">{results.totalQuestions}</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-3xl font-bold text-green-600">{results.correctAnswers}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{Math.round(results.accuracyRate * 100)}%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-3xl font-bold text-purple-600">{Math.round(results.averageMastery * 100)}%</div>
              <div className="text-sm text-muted-foreground">Mastery</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Map */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Mastered */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Strengths
            </CardTitle>
            <CardDescription>
              You've got these down!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!results.masteredTopics || results.masteredTopics.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No topics fully mastered yet - but that's okay! We'll work on building these skills.
              </p>
            ) : (
              results.masteredTopics.map((topic) => {
                const topicData = results.masteryByTopic?.[topic];
                const masteryPercent = (topicData?.mastery || 0) * 100;
                return (
                  <div key={topic} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{topic}</span>
                      <span className="text-muted-foreground">{Math.round(masteryPercent)}%</span>
                    </div>
                    <Progress value={masteryPercent} className="h-2" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <TrendingUp className="h-5 w-5" />
              Growing
            </CardTitle>
            <CardDescription>
              You're on your way!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!results.topicBreakdown?.growing || results.topicBreakdown.growing.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No topics in progress
              </p>
            ) : (
              results.topicBreakdown.growing.map(({ topic, mastery }) => (
                <div key={topic} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{topic}</span>
                    <span className="text-muted-foreground">{Math.round(mastery)}%</span>
                  </div>
                  <Progress value={mastery} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Needs Work */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <AlertCircle className="h-5 w-5" />
              Focus Areas
            </CardTitle>
            <CardDescription>
              Let's learn these together!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!results.topicBreakdown?.needsWork || results.topicBreakdown.needsWork.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Great job! No major gaps identified.
              </p>
            ) : (
              results.topicBreakdown.needsWork.map(({ topic, mastery }) => (
                <div key={topic} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{topic}</span>
                    <span className="text-muted-foreground">{Math.round(mastery)}%</span>
                  </div>
                  <Progress value={mastery} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
          <CardDescription>
            {(results.knowledgeBoundaries && results.knowledgeBoundaries.length > 0) || 
             (results.strugglingTopics && results.strugglingTopics.length > 0) 
              ? "We found some foundational gaps. Let's create a targeted course to address them!"
              : "Based on your results, we can create a personalized learning plan that's just right for you!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(results.knowledgeBoundaries && results.knowledgeBoundaries.length > 0) || 
           (results.strugglingTopics && results.strugglingTopics.length > 0) ? (
            <>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📚 Recommended: Create Foundations Course
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  We'll create a targeted course that focuses specifically on filling the gaps we found, 
                  so you have a solid foundation before moving to grade-level work.
                </p>
                <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <li>• Focuses on prerequisites you need</li>
                  <li>• Starts at your current level</li>
                  <li>• Builds systematically to fill gaps</li>
                  <li>• Prepares you for more advanced topics</li>
                </ul>
              </div>

              <Button onClick={handleCreateBridgeCourse} className="w-full" size="lg" disabled={isGenerating}>
                {isGenerating ? 'Creating course...' : 'Create Foundations Course'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                This will create a personalized course addressing {results.knowledgeBoundaries?.length || 0} knowledge boundaries 
                and {results.strugglingTopics?.length || 0} struggling topics
              </p>
            </>
          ) : (
            <>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>No major gaps found - you're ready for grade-level work!</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Your results will inform future assignments</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>We'll continue to monitor and adjust</span>
                </li>
              </ul>

              <Button onClick={() => navigate('/student/dashboard')} className="w-full" size="lg">
                Return to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}