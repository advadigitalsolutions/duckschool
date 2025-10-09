import { useState, useEffect, useRef, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Pause, Play, VolumeX } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { cleanMarkdown } from '@/utils/textFormatting';
import { supabase } from '@/integrations/supabase/client';

interface TextToSpeechProps {
  text: string;
  children?: ReactNode;
  className?: string;
}

export function TextToSpeech({ text, children, className = '' }: TextToSpeechProps) {
  const { textToSpeechEnabled } = useAccessibility();
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const cleanText = cleanMarkdown(text);
    const wordArray = cleanText.split(/(\s+)/);
    setWords(wordArray);
  }, [text]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, []);

  if (!textToSpeechEnabled) return <>{children}</> || null;

  const handleSpeak = async () => {
    if (speaking && !paused) {
      audioRef.current?.pause();
      setPaused(true);
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    } else if (paused && audioRef.current) {
      audioRef.current.play();
      setPaused(false);
      startWordTracking();
    } else {
      try {
        setSpeaking(true);
        setCurrentWordIndex(0);
        
        // Call OpenAI TTS through edge function
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: { text: cleanMarkdown(text) }
        });

        if (error) throw error;

        // Create audio element and play
        const audioBlob = new Blob([data], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setSpeaking(false);
          setPaused(false);
          setCurrentWordIndex(-1);
          if (timeUpdateIntervalRef.current) {
            clearInterval(timeUpdateIntervalRef.current);
          }
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          setSpeaking(false);
          setPaused(false);
          setCurrentWordIndex(-1);
          if (timeUpdateIntervalRef.current) {
            clearInterval(timeUpdateIntervalRef.current);
          }
        };

        await audio.play();
        startWordTracking();
      } catch (error) {
        console.error('Error playing text-to-speech:', error);
        setSpeaking(false);
        setPaused(false);
        setCurrentWordIndex(-1);
      }
    }
  };

  const startWordTracking = () => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    const wordsCount = words.filter(w => !/^\s+$/.test(w)).length;
    
    timeUpdateIntervalRef.current = setInterval(() => {
      if (!audio) return;
      
      const progress = audio.currentTime / audio.duration;
      const wordIndex = Math.floor(progress * wordsCount);
      setCurrentWordIndex(wordIndex);
    }, 50);
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
    }
    setSpeaking(false);
    setPaused(false);
    setCurrentWordIndex(-1);
  };

  const renderHighlightedText = () => {
    if (!children) return null;
    
    if (!speaking) return children;

    // If we have children, we need to highlight words in the text
    let wordCount = 0;
    return (
      <span>
        {words.map((word, index) => {
          const isWhitespace = /^\s+$/.test(word);
          
          if (isWhitespace) {
            return <span key={index}>{word}</span>;
          }
          
          const isCurrentWord = wordCount === currentWordIndex;
          wordCount++;
          
          return (
            <span
              key={index}
              className={`transition-all duration-200 ${
                isCurrentWord
                  ? 'bg-primary text-primary-foreground px-1 rounded font-medium'
                  : ''
              }`}
            >
              {word}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSpeak}
          className="gap-2 hover-scale"
        >
          {speaking && !paused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {speaking && !paused ? 'Pause' : paused ? 'Resume' : 'Read Aloud'}
        </Button>
        {speaking && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStop}
            className="gap-2 animate-fade-in"
          >
            <VolumeX className="h-4 w-4" />
            Stop
          </Button>
        )}
      </div>
      {renderHighlightedText()}
    </div>
  );
}
