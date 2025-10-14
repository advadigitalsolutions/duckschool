import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useBionicReading } from '@/contexts/BionicReadingContext';

export default function LearningWindow() {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url');
  const title = searchParams.get('title');
  const sessionId = searchParams.get('sessionId');
  const [channel] = useState(() => new BroadcastChannel('learning-window'));
  const { enabled: bionicEnabled } = useBionicReading();
  const accessibility = useAccessibility();

  useEffect(() => {
    // Apply accessibility settings
    if (accessibility.dyslexiaFontEnabled) {
      document.body.classList.add('font-opendyslexic');
    }

    if (accessibility.colorOverlay !== 'none') {
      document.body.style.backgroundColor = accessibility.colorOverlay;
    }

    // Apply line spacing
    if (accessibility.lineSpacing !== 'normal') {
      const lineHeight = accessibility.lineSpacing === '1.5x' ? '1.5' : '2';
      document.body.style.lineHeight = lineHeight;
    }

    // Apply letter spacing
    if (accessibility.letterSpacing !== 'normal') {
      const spacing = accessibility.letterSpacing === 'wide' ? '0.05em' : '0.1em';
      document.body.style.letterSpacing = spacing;
    }
  }, [accessibility]);

  useEffect(() => {
    if (!sessionId) return;

    // Send "still learning" heartbeat every 2 seconds
    const interval = setInterval(() => {
      channel.postMessage({
        type: 'learning-activity',
        sessionId,
        timestamp: Date.now(),
        url,
        title
      });
    }, 2000);

    // Send initial message
    channel.postMessage({
      type: 'learning-window-opened',
      sessionId,
      url,
      title,
      timestamp: Date.now()
    });

    return () => {
      clearInterval(interval);
      channel.postMessage({
        type: 'learning-window-closed',
        sessionId,
        url,
        title,
        timestamp: Date.now()
      });
      channel.close();
    };
  }, [sessionId, url, title]);

  const handleClose = () => {
    window.close();
  };

  if (!url) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No URL provided</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <h1 className="text-sm font-medium truncate flex-1">{title || 'Learning Resource'}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <iframe
        src={url}
        className="flex-1 w-full border-0"
        title={title || 'Learning Resource'}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
