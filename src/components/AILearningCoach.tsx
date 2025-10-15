import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Loader2, ChevronRight, Maximize2, PanelRightOpen, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RealtimeChat } from '@/utils/RealtimeAudio';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AILearningCoachProps {
  assignmentId: string;
  studentId: string;
  currentStep: string;
  studentContext: {
    resources?: any[];
    notes?: string;
    conceptsCovered?: string[];
    personalityType?: string;
    learningProfile?: any;
  };
  assignmentBody: any;
  onHistoryUpdate?: (history: Message[]) => void;
  onSidebarModeChange?: (isSidebar: boolean) => void;
}

export const AILearningCoach: React.FC<AILearningCoachProps> = ({
  assignmentId,
  studentId,
  currentStep,
  studentContext,
  assignmentBody,
  onHistoryUpdate,
  onSidebarModeChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarMode, setIsSidebarMode] = useState(false);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [audioStatus, setAudioStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const realtimeChatRef = useRef<RealtimeChat | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentStreamedMessage]);

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory();
  }, [assignmentId, studentId]);

  const loadConversationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_learning_progress')
        .select('ai_coaching_history')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;

      if (data?.ai_coaching_history) {
        const history = Array.isArray(data.ai_coaching_history) ? data.ai_coaching_history : [];
        setMessages(history.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const saveConversationHistory = async (newMessages: Message[]) => {
    try {
      // Upsert progress record with updated history
      const { error } = await supabase
        .from('assignment_learning_progress')
        .upsert([{
          assignment_id: assignmentId,
          student_id: studentId,
          ai_coaching_history: newMessages as any,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'assignment_id,student_id'
        });

      if (error) throw error;
      
      if (onHistoryUpdate) {
        onHistoryUpdate(newMessages);
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setCurrentStreamedMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Count user messages for discussion phase
      const userMessageCount = newMessages.filter(m => m.role === 'user').length;

      const response = await supabase.functions.invoke('learning-coach-chat', {
        body: {
          message: userMessage.content,
          conversationHistory: newMessages.slice(-10), // Last 10 messages for context
          currentStep,
          studentContext,
          assignmentBody,
          exchangeCount: userMessageCount // Pass exchange count for wrap-up logic
        }
      });

      if (response.error) throw response.error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date()
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      await saveConversationHistory(updatedMessages);
      setCurrentStreamedMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI coach. Please try again.",
        variant: "destructive"
      });
      
      // Remove the user message since we couldn't get a response
      setMessages(messages);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSidebarMode = () => {
    const newMode = !isSidebarMode;
    setIsSidebarMode(newMode);
    if (onSidebarModeChange) {
      onSidebarModeChange(newMode);
    }
  };

  const startAudioMode = async () => {
    try {
      const chat = new RealtimeChat(
        (message) => {
          if (message.type === 'transcript') {
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.role === 'assistant') {
                return prev.map((m, i) => 
                  i === prev.length - 1 
                    ? { ...m, content: (m.content || '') + message.content }
                    : m
                );
              }
              return [...prev, { role: 'assistant', content: message.content, timestamp: new Date() }];
            });
          } else if (message.type === 'user_transcript') {
            setMessages(prev => [...prev, { role: 'user', content: message.content, timestamp: new Date() }]);
          }
        },
        (status) => {
          setAudioStatus(status);
          if (status === 'disconnected') {
            setIsAudioMode(false);
          }
        }
      );

      await chat.init(currentStep, studentContext, assignmentBody);
      realtimeChatRef.current = chat;
      setIsAudioMode(true);
      
      toast({
        title: "Audio mode active",
        description: "Start speaking to chat with your AI coach",
      });
    } catch (error) {
      console.error('Error starting audio mode:', error);
      toast({
        title: "Error",
        description: "Failed to start audio mode. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopAudioMode = () => {
    realtimeChatRef.current?.disconnect();
    realtimeChatRef.current = null;
    setIsAudioMode(false);
    setAudioStatus('disconnected');
  };

  useEffect(() => {
    return () => {
      if (realtimeChatRef.current) {
        realtimeChatRef.current.disconnect();
      }
    };
  }, []);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full h-14 w-14 shadow-lg z-50 bg-orange-500 hover:bg-orange-600 text-white"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  const chatContent = (
    <>
      <div className="flex items-center justify-between p-4 border-b drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Learning Coach</h3>
          {isAudioMode && (
            <span className="text-xs px-2 py-1 rounded-full bg-orange-500 text-white">
              {audioStatus === 'connecting' ? 'Connecting...' : 
               audioStatus === 'connected' ? '🎤 Listening' : 'Disconnected'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isAudioMode ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={stopAudioMode}
              className="text-orange-500"
              title="Stop audio mode"
            >
              <MicOff className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={startAudioMode}
              title="Start audio mode"
            >
              <Mic className="h-4 w-4" />
            </Button>
          )}
          {!isSidebarMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebarMode}
              title="Switch to sidebar mode"
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          )}
          {isSidebarMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebarMode}
              title="Switch to floating mode"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsOpen(false);
              stopAudioMode();
              if (isSidebarMode && onSidebarModeChange) {
                setIsSidebarMode(false);
                onSidebarModeChange(false);
              }
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Hello! I'm your AI learning coach.</p>
              <p className="mt-2">Ask me anything about this assignment!</p>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              className={cn(
                "flex",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                {currentStreamedMessage ? (
                  <p className="text-sm whitespace-pre-wrap">{currentStreamedMessage}</p>
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        {isAudioMode ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Mic className="h-5 w-5 text-orange-500 animate-pulse" />
              <p className="text-sm">Speaking with your coach...</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click the mic icon to return to text mode
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask your coach..."
              disabled={isStreaming}
              rows={2}
              className="resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="h-full"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );

  // Sidebar mode - fixed to right side
  if (isSidebarMode) {
    return (
      <Card className="fixed top-0 right-0 h-screen w-96 shadow-2xl flex flex-col z-40 rounded-none border-l">
        {chatContent}
      </Card>
    );
  }

  // Floating mode - draggable and resizable
  return (
    <Rnd
      default={{
        x: window.innerWidth / 2 - 192,
        y: window.innerHeight - 650,
        width: 384,
        height: 600,
      }}
      minWidth={320}
      minHeight={400}
      maxWidth={600}
      maxHeight={800}
      bounds="window"
      dragHandleClassName="drag-handle"
      className="z-50"
    >
      <Card className="w-full h-full shadow-2xl flex flex-col">
        {chatContent}
      </Card>
    </Rnd>
  );
};
