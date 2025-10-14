import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Format markdown to HTML for clean display
const formatMessage = (text: string): string => {
  return text
    // Bold text: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic text: *text* or _text_
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Escape any remaining HTML
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Re-enable our formatted tags
    .replace(/&lt;strong&gt;/g, '<strong>')
    .replace(/&lt;\/strong&gt;/g, '</strong>')
    .replace(/&lt;em&gt;/g, '<em>')
    .replace(/&lt;\/em&gt;/g, '</em>')
    .replace(/&lt;br&gt;/g, '<br>');
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface StandardsPlanningChatProps {
  sessionId: string;
  phase: string;
  onComplete?: (requirements: any) => void;
}

export const StandardsPlanningChat = ({ sessionId, phase, onComplete }: StandardsPlanningChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you set up your standards framework. Let's start by understanding your needs. What state are you homeschooling in, and what grade level?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requirements, setRequirements] = useState<any>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('standards-planning-chat', {
        body: {
          sessionId,
          message: userMessage,
          phase
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      
      if (data.requirements) {
        setRequirements(data.requirements);
        
        // Check if we have enough info to proceed
        if (data.requirements.state && data.requirements.grade) {
          setTimeout(() => {
            const proceed = confirm(
              `I've gathered the following:\n` +
              `State: ${data.requirements.state}\n` +
              `Grade: ${data.requirements.grade}\n` +
              `Subjects: ${data.requirements.subjects?.join(', ') || 'All core subjects'}\n\n` +
              `Ready to research standards and legal requirements?`
            );
            if (proceed) {
              onComplete?.(data.requirements);
            }
          }, 1000);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {msg.role === 'assistant' && (
                  <Sparkles className="h-4 w-4 inline mr-2" />
                )}
                <span 
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessage(msg.content)
                  }}
                />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse">●</div>
                  <div className="animate-pulse delay-100">●</div>
                  <div className="animate-pulse delay-200">●</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <Button onClick={sendMessage} disabled={isLoading} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};