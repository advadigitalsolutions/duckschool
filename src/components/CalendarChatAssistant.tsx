import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Loader2, X, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  proposedAction?: {
    type: string;
    details: any;
    explanation: string;
    preview?: string[];
  };
}

interface CalendarChatAssistantProps {
  studentId: string;
  assignments: any[];
  blocks: any[];
  currentWeekStart: string;
  currentWeekEnd: string;
  dailyWorkloadMinutes: Record<string, number>;
  onRefresh: () => void;
}

export const CalendarChatAssistant: React.FC<CalendarChatAssistantProps> = ({
  studentId,
  assignments,
  blocks,
  currentWeekStart,
  currentWeekEnd,
  dailyWorkloadMinutes,
  onRefresh
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<CalendarChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: CalendarChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setPendingAction(null);

    try {
      const calendarContext = {
        studentId,
        assignments,
        blocks,
        currentWeekStart,
        currentWeekEnd,
        dailyWorkloadMinutes
      };

      const response = await supabase.functions.invoke('calendar-assistant-chat', {
        body: {
          message: userMessage.content,
          conversationHistory: newMessages.slice(-10),
          calendarContext
        }
      });

      if (response.error) throw response.error;

      const assistantMessage: CalendarChatMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
        proposedAction: response.data.proposedAction
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      if (response.data.proposedAction) {
        setPendingAction(response.data.proposedAction);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get response from calendar assistant. Please try again.",
        variant: "destructive"
      });
      
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAction = async () => {
    if (!pendingAction) return;

    setIsLoading(true);

    try {
      const calendarContext = {
        studentId,
        assignments,
        blocks,
        currentWeekStart,
        currentWeekEnd,
        dailyWorkloadMinutes
      };

      const response = await supabase.functions.invoke('calendar-assistant-chat', {
        body: {
          message: '',
          conversationHistory: messages.slice(-10),
          calendarContext,
          approvedAction: pendingAction
        }
      });

      if (response.error) throw response.error;

      const confirmationMessage: CalendarChatMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date()
      };

      setMessages([...messages, confirmationMessage]);
      setPendingAction(null);

      toast({
        title: "Success",
        description: "Calendar updated successfully!",
      });

      // Refresh the calendar
      onRefresh();

    } catch (error: any) {
      console.error('Error executing action:', error);
      toast({
        title: "Error",
        description: "Failed to update calendar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectAction = () => {
    setPendingAction(null);
    
    const rejectMessage: CalendarChatMessage = {
      role: 'assistant',
      content: "No problem! Let me know if you'd like to try a different approach.",
      timestamp: new Date()
    };

    setMessages([...messages, rejectMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Rnd
      default={{
        x: window.innerWidth - 420,
        y: window.innerHeight - 600,
        width: 400,
        height: isCollapsed ? 60 : 500,
      }}
      minWidth={350}
      minHeight={isCollapsed ? 60 : 300}
      maxHeight={isCollapsed ? 60 : 700}
      bounds="window"
      dragHandleClassName="drag-handle"
      className="z-50"
    >
      <Card className="h-full flex flex-col shadow-2xl border-2">
        {/* Header */}
        <div className="drag-handle cursor-move bg-primary text-primary-foreground p-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="font-semibold">Calendar Assistant</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div ref={scrollRef} className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground p-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Ask me to help manage your calendar!
                    </p>
                    <p className="text-xs mt-2 opacity-75">
                      Examples: "Block off Christmas week" or "Move this assignment to a lighter day"
                    </p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={idx} className={cn(
                    "flex",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}>
                    <div className={cn(
                      "max-w-[85%] rounded-lg p-3 text-sm",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      
                      {msg.proposedAction && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="space-y-1 mb-3">
                            {msg.proposedAction.preview?.map((line, i) => (
                              <div key={i} className="text-xs opacity-90">
                                {line}
                              </div>
                            ))}
                          </div>
                          {idx === messages.length - 1 && pendingAction && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleApproveAction}
                                disabled={isLoading}
                                className="flex-1"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRejectAction}
                                disabled={isLoading}
                                className="flex-1"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about your schedule..."
                  className="min-h-[40px] max-h-[80px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="h-10 w-10 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </Rnd>
  );
};
