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
    if (!elementRef.current) return;

    if (focusModeEnabled) {
      elementRef.current.classList.add('focus-mode-active');
    } else {
      elementRef.current.classList.remove('focus-mode-active');
    }
  }, [focusModeEnabled]);

  return elementRef;
}
