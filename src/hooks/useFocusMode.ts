import { useEffect, useRef } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

/**
 * Hook to apply focus mode styling to a specific element
 * Usage: const focusRef = useFocusMode();
 * Then add ref={focusRef} to the element you want to highlight in focus mode
 */
export function useFocusMode() {
  const elementRef = useRef<HTMLDivElement>(null);
  const { focusModeEnabled } = useAccessibility();

  useEffect(() => {
    const body = document.body;
    
    if (!elementRef.current) return;

    console.log('useFocusMode effect - enabled:', focusModeEnabled, 'element:', elementRef.current);

    if (focusModeEnabled) {
      elementRef.current.classList.add('focus-mode-active');
      body.classList.add('has-focus');
      console.log('Added focus-mode-active class and has-focus to body');
    } else {
      elementRef.current.classList.remove('focus-mode-active');
      body.classList.remove('has-focus');
      console.log('Removed focus-mode-active class and has-focus from body');
    }

    return () => {
      elementRef.current?.classList.remove('focus-mode-active');
      body.classList.remove('has-focus');
    };
  }, [focusModeEnabled]);

  return elementRef;
}
