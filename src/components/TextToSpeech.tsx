import { useState, useEffect, useRef, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Pause, Play, VolumeX, Volume2 } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { cleanMarkdown } from '@/utils/textFormatting';
import { useToast } from '@/hooks/use-toast';

interface TextToSpeechProps {
  text: string;
  children?: ReactNode;
  className?: string;
}

export function TextToSpeech({ text, children, className = '' }: TextToSpeechProps) {
  const { textToSpeechEnabled, textToSpeechVoice, availableVoices } = useAccessibility();
  const { toast } = useToast();
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [words, setWords] = useState<string[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const cleanText = cleanMarkdown(text);
    const wordArray = cleanText.split(/(\s+)/);
    setWords(wordArray);
  }, [text]);

  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }
    };
  }, []);

  if (!textToSpeechEnabled) return <>{children}</> || null;

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Not Supported",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    // If already speaking, toggle pause/resume
    if (speaking) {
      if (paused) {
        window.speechSynthesis.resume();
        setPaused(false);
      } else {
        window.speechSynthesis.pause();
        setPaused(true);
      }
      return;
    }

    try {
      // Clean text for speech
      const cleanText = text.replace(/<[^>]*>/g, '').trim();
      if (!cleanText) return;

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;

      // Find and set the selected voice
      if (textToSpeechVoice && availableVoices.length > 0) {
        const selectedVoice = availableVoices.find(v => v.name === textToSpeechVoice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      // Build character position to word index map
      const wordPositions: { start: number; end: number; index: number }[] = [];
      let charPos = 0;
      let wordIdx = 0;
      
      words.forEach((word) => {
        const isWhitespace = /^\s+$/.test(word);
        if (!isWhitespace) {
          wordPositions.push({
            start: charPos,
            end: charPos + word.length,
            index: wordIdx
          });
          wordIdx++;
        }
        charPos += word.length;
      });

      // Track word boundaries for highlighting using character positions
      utterance.onboundary = (event) => {
        if (event.name === 'word' && event.charIndex !== undefined) {
          // Find which word index corresponds to this character position
          const matchedWord = wordPositions.find(
            pos => event.charIndex >= pos.start && event.charIndex < pos.end
          );
          
          if (matchedWord) {
            setCurrentWordIndex(matchedWord.index);
          }
        }
      };

      utterance.onstart = () => {
        setSpeaking(true);
        setPaused(false);
        setCurrentWordIndex(0);
      };

      utterance.onend = () => {
        setSpeaking(false);
        setPaused(false);
        setCurrentWordIndex(-1);
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setSpeaking(false);
        setPaused(false);
        setCurrentWordIndex(-1);
        toast({
          title: "Playback Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
        });
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Text-to-speech error:', error);
      setSpeaking(false);
      setPaused(false);
      setCurrentWordIndex(-1);
      toast({
        title: "Error",
        description: "Failed to start text-to-speech.",
        variant: "destructive",
      });
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
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
          {speaking && !paused ? (
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
              <Volume2 className="h-4 w-4" />
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
