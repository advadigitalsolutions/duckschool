import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface CurriculumPlanningChatProps {
  onComplete?: (sessionId: string, collectedData: any) => void;
}

export const CurriculumPlanningChat = ({ onComplete }: CurriculumPlanningChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stage, setStage] = useState('');
  const [collectedData, setCollectedData] = useState<any>({});
  const [canFinalize, setCanFinalize] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startSession();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Curriculum Planning Assistant
        </CardTitle>
        {stage && (
          <p className="text-sm text-muted-foreground">
            Stage: {stage.replace('_', ' ')}
          </p>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {canFinalize && (
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm font-medium mb-2">Ready to create curriculum!</p>
            <p className="text-sm text-muted-foreground mb-3">
              I've gathered all the information needed. Click below to generate your personalized curriculum plan.
            </p>
            <Button onClick={handleFinalize} className="w-full">
              Create Curriculum Plan
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <div className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your response..."
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};