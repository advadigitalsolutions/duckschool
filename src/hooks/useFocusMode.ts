import { useEffect } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

/**
 * Hook to automatically apply focus mode to main content
 * No ref needed - automatically highlights [role="main"] or main elements
 */
export function useFocusMode() {
  const { focusModeEnabled } = useAccessibility();

  useEffect(() => {
    console.log('useFocusMode: Focus mode changed to', focusModeEnabled);
    
    // Find all potential main content areas
    const mainElements = document.querySelectorAll('main, [role="main"], .main-content');
    
    console.log('Found main elements:', mainElements.length);
    
    mainElements.forEach((element) => {
      if (focusModeEnabled) {
        element.classList.add('focus-mode-active');
        console.log('Added focus-mode-active to', element);
      } else {
        element.classList.remove('focus-mode-active');
        console.log('Removed focus-mode-active from', element);
      }
    });

    // Also add to container divs with specific patterns
    const containers = document.querySelectorAll('.container.mx-auto');
    console.log('Found container elements:', containers.length);
    
    containers.forEach((element) => {
      if (focusModeEnabled) {
        element.classList.add('focus-mode-active');
      } else {
        element.classList.remove('focus-mode-active');
      }
    });

    const body = document.body;
    if (focusModeEnabled && (mainElements.length > 0 || containers.length > 0)) {
      body.classList.add('has-focus');
    } else {
      body.classList.remove('has-focus');
    }
  }, [focusModeEnabled]);
}
