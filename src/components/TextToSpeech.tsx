import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { cleanMarkdown } from '@/utils/textFormatting';

interface TextToSpeechProps {
  text: string;
  className?: string;
}

export function TextToSpeech({ text, className = '' }: TextToSpeechProps) {
  const { textToSpeechEnabled } = useAccessibility();
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported('speechSynthesis' in window);
  }, []);

  useEffect(() => {
    return () => {
      if (speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [speaking]);

  if (!textToSpeechEnabled || !supported) return null;

  const handleSpeak = () => {
    if (speaking && !paused) {
      window.speechSynthesis.pause();
      setPaused(true);
    } else if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else {
      const cleanText = cleanMarkdown(text);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);
      };
      
      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
      };
      
      utterance.onerror = () => {
        setSpeaking(false);
        setPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSpeak}
        className="gap-2"
      >
        {speaking && !paused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {speaking && !paused ? 'Pause' : paused ? 'Resume' : 'Read Aloud'}
      </Button>
      {speaking && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleStop}
          className="gap-2"
        >
          <VolumeX className="h-4 w-4" />
          Stop
        </Button>
      )}
    </div>
  );
}
