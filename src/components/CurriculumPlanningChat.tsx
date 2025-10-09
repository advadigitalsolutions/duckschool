import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Loader2, Send, Sparkles, Bookmark, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cleanMarkdown } from '@/utils/textFormatting';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface CurriculumPlanningChatProps {
  onComplete?: (sessionId: string, collectedData: any) => void;
  existingSessionId?: string; // Allow resuming existing sessions
}

export const CurriculumPlanningChat = ({ onComplete, existingSessionId }: CurriculumPlanningChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId || null);
  const [stage, setStage] = useState('');
  const [collectedData, setCollectedData] = useState<any>({});
  const [canFinalize, setCanFinalize] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existingSessionId) {
      loadExistingSession(existingSessionId);
    } else {
      startSession();
    }
  }, [existingSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadExistingSession = async (id: string) => {
    setLoading(true);
    try {
      const { data: session, error } = await supabase
        .from('curriculum_planning_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setSessionId(session.id);
      const history = (session.conversation_history as unknown as Message[]) || [];
      const data = (session.collected_data as unknown as any) || {};
      
      setMessages(history);
      setCollectedData(data);
      setStage(determineStage(data));
      
      // Check if ready to finalize
      setCanFinalize(!!(
        data.studentName &&
        data.gradeLevel &&
        data.location &&
        data.standardsFramework &&
        data.subjects &&
        data.goals
      ));

      toast.success('Resumed your planning session');
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load session, starting fresh');
      startSession();
    } finally {
      setLoading(false);
    }
  };

  const determineStage = (data: any): string => {
    if (!data.studentName || !data.gradeLevel) return 'initial';
    if (!data.location || !data.standardsFramework) return 'framework';
    if (!data.subjects || !data.goals) return 'goals';
    return 'ready';
  };

  const startSession = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('curriculum-planning-chat', {
        body: { action: 'start' }
      });

      if (error) throw error;

      setSessionId(data.sessionId);
      setMessages([data.message]);
      setStage(data.stage);
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start planning session');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('curriculum-planning-chat', {
        body: {
          sessionId,
          message: input,
          action: 'continue'
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, data.message]);
      setStage(data.stage);
      setCollectedData(data.collectedData);
      setCanFinalize(data.canFinalize);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = () => {
    if (canFinalize && onComplete) {
      onComplete(sessionId!, collectedData);
    }
  };

  const handleSaveProgress = () => {
    toast.success('Progress automatically saved!', {
      description: 'You can close this and return anytime from the Curriculum Planning tab.',
      duration: 4000
    });
  };

  const getStageLabel = (stage: string): string => {
    const labels: Record<string, string> = {
      'initial': 'Student Information',
      'framework': 'Educational Standards',
      'goals': 'Subjects & Goals',
      'ready': 'Ready to Create'
    };
    return labels[stage] || stage;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 px-6 pt-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Curriculum Planning Assistant
          </h2>
          <p className="text-muted-foreground mt-1">
            Let's create a personalized learning plan for your student
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSaveProgress}>
          <Bookmark className="h-4 w-4 mr-2" />
          Save Progress
        </Button>
      </div>

      {stage && (
        <div className="px-6 pb-4">
          <Badge variant="secondary" className="text-xs">
            {getStageLabel(stage)}
          </Badge>
        </div>
      )}

      <div className="flex-1 px-6 pb-4">
        <div 
          ref={scrollRef}
          className="h-[calc(100vh-380px)] pr-4 overflow-y-auto"
        >
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {cleanMarkdown(msg.content)}
                  </p>
                  {msg.role === 'assistant' && msg.content.includes('**') && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        This information helps us create a personalized curriculum
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border rounded-2xl px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {canFinalize && (
        <div className="mx-6 mb-4">
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <CardTitle className="text-lg">Ready to Create Your Curriculum!</CardTitle>
                  <CardDescription className="mt-2">
                    I've gathered all the information needed. Your student will receive an initial assessment 
                    to understand their current level, then we'll create a personalized, adaptive curriculum 
                    that adjusts to their needs in real-time.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={handleFinalize} size="lg" className="w-full">
                Create Curriculum & Assessment Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="px-6 pb-6">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your response..."
            disabled={loading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={loading || !input.trim()}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send • Your progress is automatically saved
        </p>
      </div>
    </div>
  );
};