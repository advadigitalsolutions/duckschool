import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { MessageCircle, User, Bot, Calendar } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface CoachingTranscriptViewerProps {
  studentId: string;
}

export const CoachingTranscriptViewer: React.FC<CoachingTranscriptViewerProps> = ({ studentId }) => {
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, [studentId]);

  const fetchProgressData = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_learning_progress')
        .select(`
          *,
          assignments:assignment_id (
            id,
            curriculum_items (
              title,
              courses (
                title,
                subject
              )
            )
          )
        `)
        .eq('student_id', studentId)
        .not('ai_coaching_history', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Filter out only those with actual coaching history
      const withHistory = (data || []).filter(
        (item) => Array.isArray(item.ai_coaching_history) && item.ai_coaching_history.length > 0
      );
      
      setProgressData(withHistory);
    } catch (error) {
      console.error('Error fetching coaching transcripts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepBadge = (step: string) => {
    const colors: Record<string, string> = {
      research: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      notes: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      discussion: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      practice: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      assessment: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };

    return (
      <Badge variant="outline" className={colors[step] || colors.completed}>
        {step.charAt(0).toUpperCase() + step.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (progressData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No AI coaching conversations found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Coaching transcripts will appear here as students interact with the AI learning coach
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {progressData.map((progress) => {
        const history = progress.ai_coaching_history || [];
        
        return (
          <Card key={progress.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {progress.assignments?.curriculum_items?.title || 'Unknown Assignment'}
                  </CardTitle>
                  <CardDescription>
                    {progress.assignments?.curriculum_items?.courses?.subject}
                  </CardDescription>
                </div>
                {getStepBadge(progress.current_step)}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Started {new Date(progress.started_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {history.length} exchanges
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {history.map((message: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex items-start gap-3">
                        {message.role === 'user' ? (
                          <div className="rounded-full bg-primary/10 p-2">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                        ) : (
                          <div className="rounded-full bg-secondary p-2">
                            <Bot className="h-4 w-4 text-secondary-foreground" />
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">
                            {message.role === 'user' ? 'Student' : 'AI Coach'}
                          </p>
                          <div className="bg-muted/50 rounded-md p-3">
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          {message.timestamp && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(message.timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {idx < history.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Progress Summary */}
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Progress Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${progress.research_completed ? 'bg-green-600' : 'bg-gray-300'}`} />
                    <span className={progress.research_completed ? 'text-foreground' : 'text-muted-foreground'}>
                      Research
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${progress.notes_completed ? 'bg-green-600' : 'bg-gray-300'}`} />
                    <span className={progress.notes_completed ? 'text-foreground' : 'text-muted-foreground'}>
                      Notes
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${progress.discussion_completed ? 'bg-green-600' : 'bg-gray-300'}`} />
                    <span className={progress.discussion_completed ? 'text-foreground' : 'text-muted-foreground'}>
                      Discussion
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${progress.practice_completed ? 'bg-green-600' : 'bg-gray-300'}`} />
                    <span className={progress.practice_completed ? 'text-foreground' : 'text-muted-foreground'}>
                      Practice
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};