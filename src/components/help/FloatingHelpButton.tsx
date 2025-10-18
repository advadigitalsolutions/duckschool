import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpMenu } from './HelpMenu';

export function FloatingHelpButton() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setMenuOpen(true)}
              className="fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-all duration-200 bg-gradient-to-br from-primary to-purple-500 hover:from-primary/90 hover:to-purple-600"
              aria-label="Help & Tutorials"
            >
              <Sparkles className="h-6 w-6 text-white animate-pulse" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Need help? 🦆</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <HelpMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
