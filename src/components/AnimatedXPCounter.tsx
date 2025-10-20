import { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';

interface AnimatedXPCounterProps {
  value: number;
  duration?: number;
}

export function AnimatedXPCounter({ value, duration = 1500 }: AnimatedXPCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue === value) return;

    setIsAnimating(true);
    const startValue = displayValue;
    const difference = value - startValue;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + difference * easeOut);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-1 shadow-2xl flex-shrink-0 transition-all duration-300">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-6">
        {/* Metallic shine effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            backgroundSize: '200% 100%',
            animation: 'slide-shine 3s ease-in-out infinite'
          }} 
        />
        
        {/* Pulse effect during animation */}
        {isAnimating && (
          <div className="absolute inset-0 bg-amber-400/20 animate-pulse rounded-xl" />
        )}
        
        <div className="relative flex items-center gap-4">
          <Coins 
            className={`h-10 w-10 text-amber-400 transition-transform duration-300 ${
              isAnimating ? 'animate-bounce' : ''
            }`} 
          />
          <div>
            <p className="text-sm font-medium text-amber-400/80 uppercase tracking-wider">Total XP</p>
            <p className={`text-5xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all duration-300 ${
              isAnimating ? 'scale-110' : ''
            }`}>
              {displayValue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
