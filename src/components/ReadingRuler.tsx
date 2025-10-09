import { useEffect, useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export function ReadingRuler() {
  const { readingRulerEnabled } = useAccessibility();
  const [position, setPosition] = useState({ y: 0, visible: false });

  useEffect(() => {
    if (!readingRulerEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ y: e.clientY, visible: true });
    };

    const handleMouseLeave = () => {
      setPosition(prev => ({ ...prev, visible: false }));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [readingRulerEnabled]);

  if (!readingRulerEnabled || !position.visible) return null;

  return (
    <div
      className="reading-ruler"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        height: '2px',
        top: `${position.y}px`,
        backgroundColor: 'hsl(var(--primary))',
        opacity: 0.6,
        pointerEvents: 'none',
        zIndex: 9999,
        boxShadow: '0 0 10px hsl(var(--primary))',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '-20px',
          height: '40px',
          backgroundColor: 'hsl(var(--primary) / 0.1)',
        }}
      />
    </div>
  );
}
