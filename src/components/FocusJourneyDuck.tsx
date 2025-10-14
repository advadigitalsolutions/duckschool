import { useEffect, useState } from 'react';

type AnimationState = 'walking' | 'falling' | 'climbing' | 'celebrating' | 'idle';

interface FocusJourneyDuckProps {
  animationState: AnimationState;
  onAnimationComplete?: () => void;
}

export function FocusJourneyDuck({ animationState, onAnimationComplete }: FocusJourneyDuckProps) {
  const [currentState, setCurrentState] = useState<AnimationState>(animationState);

  useEffect(() => {
    setCurrentState(animationState);

    // Trigger animation complete callbacks without playing sounds (sounds are handled in parent)
    switch (animationState) {
      case 'falling':
        setTimeout(() => onAnimationComplete?.(), 1000);
        break;
      case 'climbing':
        setTimeout(() => onAnimationComplete?.(), 800);
        break;
      case 'celebrating':
        setTimeout(() => onAnimationComplete?.(), 2000);
        break;
    }
  }, [animationState, onAnimationComplete]);

  return (
    <div className={`duck-container ${currentState}`}>
      <style>{`
        .duck-container {
          position: relative;
          width: 30px;
          height: 30px;
        }

        .duck {
          position: relative;
          width: 28px;
          height: 28px;
        }

        .duck-head {
          position: absolute;
          top: 2px;
          left: 14px;
          width: 12px;
          height: 12px;
          background: #FFD700;
          border-radius: 4px 4px 0 0;
          border: 1px solid #FFA500;
        }

        .duck-beak {
          position: absolute;
          top: 7px;
          left: 24px;
          width: 0;
          height: 0;
          border-top: 3px solid transparent;
          border-bottom: 3px solid transparent;
          border-left: 6px solid #FF8C00;
        }

        .duck-eye {
          position: absolute;
          top: 6px;
          left: 19px;
          width: 3px;
          height: 3px;
          background: #000;
          border-radius: 50%;
        }

        .duck-torso {
          position: absolute;
          top: 10px;
          left: 8px;
          width: 16px;
          height: 12px;
          background: #FFD700;
          border-radius: 2px;
          border: 1px solid #FFA500;
        }

        .duck-foot-left,
        .duck-foot-right {
          position: absolute;
          bottom: 0;
          width: 4px;
          height: 6px;
          background: #FF8C00;
          border-radius: 0 0 2px 2px;
        }

        .duck-foot-left {
          left: 8px;
        }

        .duck-foot-right {
          left: 16px;
        }

        /* Walking Animation */
        @keyframes walk {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-2px);
          }
          50% {
            transform: translateY(0);
          }
          75% {
            transform: translateY(-2px);
          }
        }

        @keyframes foot-walk-left {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(2px);
          }
        }

        @keyframes foot-walk-right {
          0%, 100% {
            transform: translateY(2px);
          }
          50% {
            transform: translateY(0);
          }
        }

        .duck-container.walking .duck {
          animation: walk 0.4s ease-in-out infinite;
        }

        .duck-container.walking .duck-foot-left {
          animation: foot-walk-left 0.4s ease-in-out infinite;
        }

        .duck-container.walking .duck-foot-right {
          animation: foot-walk-right 0.4s ease-in-out infinite;
        }

        /* Falling Animation */
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translateY(20px) rotate(180deg);
          }
          100% {
            transform: translateY(45px) rotate(360deg);
            opacity: 0.3;
          }
        }

        .duck-container.falling .duck {
          animation: fall 1s ease-in forwards;
        }

        /* Climbing Animation */
        @keyframes climb {
          0% {
            transform: translateY(45px) scaleX(0.9);
            opacity: 0.3;
          }
          50% {
            transform: translateY(20px) scaleX(1.1);
          }
          100% {
            transform: translateY(0) scaleX(1);
            opacity: 1;
          }
        }

        .duck-container.climbing .duck {
          animation: climb 0.8s ease-out forwards;
        }

        /* Celebration Animation */
        @keyframes celebrate {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          15% {
            transform: translateY(-10px) rotate(-5deg);
          }
          30% {
            transform: translateY(0) rotate(0deg);
          }
          45% {
            transform: translateY(-12px) rotate(5deg);
          }
          60% {
            transform: translateY(0) rotate(0deg);
          }
          75% {
            transform: translateY(-8px) rotate(-3deg);
          }
        }

        .duck-container.celebrating .duck {
          animation: celebrate 2s ease-in-out;
        }

        .duck-container.idle .duck {
          animation: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .duck-container .duck,
          .duck-container .duck-foot-left,
          .duck-container .duck-foot-right {
            animation: none !important;
          }
        }
      `}</style>
      
      <div className="duck">
        <div className="duck-head" />
        <div className="duck-beak" />
        <div className="duck-eye" />
        <div className="duck-torso" />
        <div className="duck-foot-left" />
        <div className="duck-foot-right" />
      </div>
    </div>
  );
}
