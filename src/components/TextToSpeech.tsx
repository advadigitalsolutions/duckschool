import { useState, useEffect, useRef, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Pause, Play, VolumeX, Loader2 } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { cleanMarkdown } from '@/utils/textFormatting';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TextToSpeechProps {
  text: string;
  children?: ReactNode;
  className?: string;
}

export function TextToSpeech({ text, children, className = '' }: TextToSpeechProps) {
  const { textToSpeechEnabled, textToSpeechVoice } = useAccessibility();
  const { toast } = useToast();
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
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
        setLoading(true);
        toast({
          title: "Generating audio...",
          description: "Please wait while we prepare the audio.",
        });
        
        console.log('Calling text-to-speech edge function...');
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ 
              text: cleanMarkdown(text),
              voice: textToSpeechVoice 
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate speech');
        }

        console.log('Audio received, creating blob...');
        const arrayBuffer = await response.arrayBuffer();
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        console.log('Creating audio element with URL:', audioUrl);
        const audio = new Audio();
        audio.src = audioUrl;
        audioRef.current = audio;

        audio.onended = () => {
          console.log('Audio playback ended');
          setSpeaking(false);
          setPaused(false);
          setCurrentWordIndex(-1);
          if (timeUpdateIntervalRef.current) {
            clearInterval(timeUpdateIntervalRef.current);
          }
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setSpeaking(false);
          setPaused(false);
          setCurrentWordIndex(-1);
          if (timeUpdateIntervalRef.current) {
            clearInterval(timeUpdateIntervalRef.current);
          }
        };

        console.log('Starting audio playback...');
        setLoading(false);
        setSpeaking(true);
        setCurrentWordIndex(0);
        await audio.play();
        startWordTracking();
        
        toast({
          title: "Playing audio",
          description: "Audio is now playing with word highlighting.",
        });
      } catch (error) {
        console.error('Error playing text-to-speech:', error);
        setLoading(false);
        setSpeaking(false);
        setPaused(false);
        setCurrentWordIndex(-1);
        toast({
          title: "Error",
          description: "Failed to generate or play audio. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const startWordTracking = () => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    const wordList = words.filter(w => !/^\s+$/.test(w));
    
    // Wait for metadata to load to get accurate duration
    const startTracking = () => {
      if (audio.duration && audio.duration > 0) {
        timeUpdateIntervalRef.current = setInterval(() => {
          if (!audio || audio.paused) return;
          
          const progress = audio.currentTime / audio.duration;
          const estimatedIndex = Math.floor(progress * wordList.length);
          
          // Clamp to valid range
          const clampedIndex = Math.max(0, Math.min(estimatedIndex, wordList.length - 1));
          setCurrentWordIndex(clampedIndex);
        }, 100);
      }
    };
    
    if (audio.duration) {
      startTracking();
    } else {
      audio.addEventListener('loadedmetadata', startTracking, { once: true });
    }
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
          disabled={loading}
          className="gap-2 hover-scale"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : speaking && !paused ? (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          ) : paused ? (
            <>
              <Play className="h-4 w-4" />
              Resume
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Read Aloud
            </>
          )}
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
