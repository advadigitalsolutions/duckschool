import { useEffect } from 'react';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function PomodoroFullscreen() {
  useEffect(() => {
    // Request fullscreen
    const goFullscreen = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
    };
    
    // Small delay to ensure page is loaded
    setTimeout(goFullscreen, 100);
  }, []);

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    window.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-8">
      <div className="relative w-full max-w-2xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute -top-4 -right-4 z-50 h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive/20"
        >
          <X className="h-6 w-6" />
        </Button>
        
        <PomodoroTimer />
      </div>
    </div>
  );
}
