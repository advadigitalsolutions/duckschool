import { useEffect } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

/**
 * Hook to automatically apply focus mode to main content
 * No ref needed - automatically highlights main content areas
 */
export function useFocusMode() {
  const { focusModeEnabled } = useAccessibility();

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    const applyFocusMode = () => {
      console.log('useFocusMode: Focus mode changed to', focusModeEnabled);
      
      // Find all content containers - using more specific selectors
      const containers = document.querySelectorAll('.container.mx-auto, main, [role="main"]');
      
      console.log('Found containers:', containers.length, Array.from(containers).map(el => el.className));
      
      if (containers.length === 0) {
        console.warn('No containers found for focus mode');
      }
      
      containers.forEach((element) => {
        if (focusModeEnabled) {
          element.classList.add('focus-mode-active');
          console.log('Added focus-mode-active to element');
        } else {
          element.classList.remove('focus-mode-active');
          console.log('Removed focus-mode-active from element');
        }
      });

      const body = document.body;
      if (focusModeEnabled && containers.length > 0) {
        body.classList.add('has-focus');
        console.log('Added has-focus to body');
      } else {
        body.classList.remove('has-focus');
        console.log('Removed has-focus from body');
      }
    };

    // Run immediately
    applyFocusMode();
    
    // Also run after a small delay to catch any dynamically rendered content
    const timeoutId = setTimeout(applyFocusMode, 100);
    
    return () => clearTimeout(timeoutId);
  }, [focusModeEnabled]);
}
