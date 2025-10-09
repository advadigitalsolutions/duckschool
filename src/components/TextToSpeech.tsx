import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { cleanMarkdown } from '@/utils/textFormatting';

interface TextToSpeechProps {
  text: string;
  className?: string;
  showHighlight?: boolean;
}

export function TextToSpeech({ text, className = '', showHighlight = true }: TextToSpeechProps) {
  const { textToSpeechEnabled } = useAccessibility();
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported, setSupported] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState<string[]>([]);
  const [showText, setShowText] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported('speechSynthesis' in window);
  }, []);

  useEffect(() => {
    const cleanText = cleanMarkdown(text);
    const wordArray = cleanText.split(/(\s+)/);
    setWords(wordArray);
  }, [text]);

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
      utteranceRef.current = utterance;
      
      // Make it sound more natural
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to use a more natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = voices.filter(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Natural') || 
         voice.name.includes('Premium') || 
         voice.name.includes('Enhanced') ||
         voice.name.includes('Google') ||
         voice.name.includes('Microsoft'))
      );
      if (preferredVoices.length > 0) {
        utterance.voice = preferredVoices[0];
      }
      
      let wordIndex = 0;
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          setCurrentWordIndex(wordIndex);
          wordIndex++;
        }
      };
      
      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);
        setShowText(true);
        setCurrentWordIndex(0);
      };
      
      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
        setCurrentWordIndex(-1);
        setShowText(false);
      };
      
      utterance.onerror = () => {
        setSpeaking(false);
        setPaused(false);
        setCurrentWordIndex(-1);
        setShowText(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setCurrentWordIndex(-1);
    setShowText(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
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
      
      {showHighlight && showText && speaking && (
        <div className="p-4 bg-muted/50 rounded-lg border animate-fade-in">
          <p className="text-base leading-relaxed">
            {words.map((word, index) => {
              const isCurrentWord = Math.floor(index / 2) === currentWordIndex;
              const isWhitespace = /^\s+$/.test(word);
              
              if (isWhitespace) {
                return <span key={index}>{word}</span>;
              }
              
              return (
                <span
                  key={index}
                  className={`transition-all duration-200 ${
                    isCurrentWord
                      ? 'bg-primary text-primary-foreground px-1 rounded font-medium scale-110 inline-block'
                      : ''
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </p>
        </div>
      )}
    </div>
  );
}
