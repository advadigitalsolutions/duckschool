import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Brain, MapPin, Lightbulb, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DiagnosticDetailedReportProps {
  assessmentId: string;
  results: any;
  subject: string;
  completedAt: string;
  framework?: string;
  gradeLevel?: string;
}

export function DiagnosticDetailedReport({ 
  assessmentId, 
  results, 
  subject,
  completedAt,
  framework,
  gradeLevel
}: DiagnosticDetailedReportProps) {
  
  // Fetch individual question responses
  const { data: responses } = useQuery({
    queryKey: ['diagnostic-responses', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_question_responses')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('question_number');
      
      if (error) throw error;
      return data;
    }
  });

  const masteryByTopic = results?.masteryByTopic || {};
  const knowledgeBoundaries = results?.knowledgeBoundaries || [];
  const learningPath = results?.learningPath || [];
  const masteredTopics = results?.masteredTopics || [];
  const strugglingTopics = results?.strugglingTopics || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{subject} Skills Assessment</CardTitle>
              <CardDescription className="mt-2">
                Completed {format(new Date(completedAt), 'MMMM d, yyyy')}
                {framework && ` • ${framework}`}
                {gradeLevel && ` • Grade ${gradeLevel}`}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {Math.round((results?.accuracyRate || 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Accuracy</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{results?.totalQuestions || 0}</div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-green-600">{results?.correctAnswers || 0}</div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((results?.averageMastery || 0) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Mastery</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(masteryByTopic).length}
              </div>
              <div className="text-xs text-muted-foreground">Topics Assessed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="knowledge-map" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="knowledge-map">Knowledge Map</TabsTrigger>
          <TabsTrigger value="topic-breakdown">Topic Details</TabsTrigger>
          <TabsTrigger value="learning-path">Learning Path</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>

        {/* Knowledge Map */}
        <TabsContent value="knowledge-map" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Strengths
                </CardTitle>
                <CardDescription>Topics you've mastered</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {masteredTopics.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Building your foundation - strengths will appear as you progress!
                  </p>
                ) : (
                  masteredTopics.map((item: any, idx: number) => {
                    // Handle both string and object formats
                    const topicName = typeof item === 'string' ? item : item.topic;
                    const mastery = typeof item === 'string' 
                      ? masteryByTopic[topicName] 
                      : item;
                    return (
                      <div key={`${topicName}-${idx}`} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{topicName}</span>
                          <span className="text-green-600">
                            {Math.round((mastery?.mastery || 0) * 100)}%
                          </span>
                        </div>
                        <Progress value={(mastery?.mastery || 0) * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {mastery?.attempts || 0} attempts, {mastery?.successes || 0} successful
                        </p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Growth Edges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <TrendingUp className="h-5 w-5" />
                  Growth Edges
                </CardTitle>
                <CardDescription>Your learning frontiers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {knowledgeBoundaries.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No knowledge boundaries identified
                  </p>
                ) : (
                  knowledgeBoundaries.map((item: any, idx: number) => {
                    // Handle both string and object formats
                    const topicName = typeof item === 'string' ? item : item.topic;
                    const mastery = typeof item === 'string' 
                      ? masteryByTopic[topicName] 
                      : item;
                    return (
                      <div key={`${topicName}-${idx}`} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{topicName}</span>
                          <Badge variant="outline" className="text-xs">Edge</Badge>
                        </div>
                        <Progress value={(mastery?.mastery || 0) * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Ready for targeted practice
                          {mastery?.prerequisite && ` • Build on: ${mastery.prerequisite}`}
                        </p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Focus Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <Brain className="h-5 w-5" />
                  Learning Opportunities
                </CardTitle>
                <CardDescription>Areas for growth</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {strugglingTopics.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Great foundation! Keep building on your strengths.
                  </p>
                ) : (
                  strugglingTopics.map((item: any, idx: number) => {
                    // Handle both string and object formats
                    const topicName = typeof item === 'string' ? item : item.topic;
                    const mastery = typeof item === 'string' 
                      ? masteryByTopic[topicName] 
                      : item;
                    return (
                      <div key={`${topicName}-${idx}`} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{topicName}</span>
                          <span className="text-amber-600">
                            {Math.round((mastery?.mastery || 0) * 100)}%
                          </span>
                        </div>
                        <Progress value={(mastery?.mastery || 0) * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {mastery?.attempts || 0} attempts so far
                        </p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Topic Breakdown */}
        <TabsContent value="topic-breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Topic-by-Topic Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of your performance across all topics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(masteryByTopic).map(([topic, data]: [string, any]) => (
                  <div key={topic} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold">{topic}</h4>
                        {data.prerequisite && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Prerequisite: {data.prerequisite}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {Math.round(data.mastery * 100)}%
                        </div>
                        {data.isKnowledgeBoundary && (
                          <Badge variant="outline" className="mt-1">
                            Knowledge Edge
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Progress value={data.mastery * 100} className="mb-3" />
                    
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="text-center p-2 rounded bg-muted/50">
                        <div className="font-bold">{data.attempts || 0}</div>
                        <div className="text-xs text-muted-foreground">Attempts</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/50">
                        <div className="font-bold">{data.successes || 0}</div>
                        <div className="text-xs text-muted-foreground">Successful</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/50">
                        <div className="font-bold">
                          {data.attempts > 0 ? Math.round((data.successes / data.attempts) * 100) : 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/50">
                        <div className="font-bold">{Math.round((data.confidence || 0) * 100)}%</div>
                        <div className="text-xs text-muted-foreground">Confidence</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Path */}
        <TabsContent value="learning-path" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Personalized Learning Path
              </CardTitle>
              <CardDescription>
                Recommended topics to work on, prioritized for maximum growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              {learningPath.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Learning path will be generated based on your responses
                </p>
              ) : (
                <div className="space-y-3">
                  {learningPath.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 p-4 rounded-lg border hover:bg-accent/5">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{item.topic}</h4>
                          <Badge 
                            variant={
                              item.priority === 'high' ? 'destructive' : 
                              item.priority === 'medium' ? 'default' : 
                              'secondary'
                            }
                          >
                            {item.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <Lightbulb className="h-3 w-3 inline mr-1" />
                          {item.reason}
                        </p>
                        {item.prerequisite && (
                          <p className="text-xs text-muted-foreground">
                            <ArrowRight className="h-3 w-3 inline mr-1" />
                            Builds on: {item.prerequisite}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Review */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Question-by-Question Review</CardTitle>
              <CardDescription>
                All questions from your assessment with detailed feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!responses || responses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Question details not available
                </p>
              ) : (
                <div className="space-y-4">
                  {responses.map((response) => {
                    const questionData = response.question_data as any;
                    const studentResponse = response.student_response as any;
                    
                    return (
                      <div key={response.id} className="p-4 rounded-lg border">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0">
                            {response.is_correct ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium">Question {response.question_number}</p>
                                {response.standard_code && (
                                  <p className="text-xs text-muted-foreground">
                                    Standard: {response.standard_code}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline">
                                Difficulty: {response.difficulty_level?.toFixed(1) || 'N/A'}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">Question:</p>
                                <p>{questionData?.question || 'Question text not available'}</p>
                              </div>
                              
                              <div>
                                <p className="text-muted-foreground mb-1">Your Answer:</p>
                                <p className={response.is_correct ? 'text-green-600' : 'text-red-600'}>
                                  {studentResponse?.answer || 'No response recorded'}
                                </p>
                              </div>
                              
                              {!response.is_correct && questionData?.correctAnswer && (
                                <div>
                                  <p className="text-muted-foreground mb-1">Correct Answer:</p>
                                  <p className="text-green-600">{questionData.correctAnswer}</p>
                                </div>
                              )}
                              
                              {response.ai_feedback && (
                                <div className="mt-3 p-3 rounded-lg bg-muted/50">
                                  <p className="text-xs font-medium mb-1 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Feedback:
                                  </p>
                                  <p className="text-sm">{response.ai_feedback}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
