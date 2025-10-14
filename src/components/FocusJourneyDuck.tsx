import { useEffect, useState, useMemo } from 'react';
import { playRandomClickSound } from '@/utils/soundEffects';

type AnimationState = 'walking' | 'falling' | 'fallen' | 'ghostly-jumping' | 'climbing' | 'celebrating' | 'celebrating-return' | 'idle' | 'jumping';

interface FocusJourneyDuckProps {
  animationState: AnimationState;
  onAnimationComplete?: () => void;
  onStateChange?: (state: AnimationState) => void; // Notify parent of internal state changes
}

const ATTENTION_MESSAGES = [
  "I feel so alone!",
  "where did you go??",
  "help! I've been abandoned!",
  "come baaaaaaaack!!!!!",
  "aaaa!!?!?!?!?!",
  "GET BACK TO WORK OR I WILL SURELY PERISH"
];

const RETURN_MESSAGES = [
  "yaaay! you're back!!!!",
  "I thought you died!?",
  "did you bring me a snack?",
  "friend!!!",
  "QUACK!!!",
  "I MISSSED YOU SO MUCH",
  "i love you!"
];

export function FocusJourneyDuck({ animationState, onAnimationComplete, onStateChange }: FocusJourneyDuckProps) {
  const [currentState, setCurrentState] = useState<AnimationState>(animationState);
  const [messageIndex, setMessageIndex] = useState(0);
  const [returnMessageIndex, setReturnMessageIndex] = useState(0);
  const [ghostPosition, setGhostPosition] = useState({ left: 20, top: 30 });
  const [fallenTimeout, setFallenTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const handleDuckClick = () => {
    playRandomClickSound(0.6);
  };
  
  // Rotate message when jumping starts
  const currentMessage = useMemo(() => {
    return ATTENTION_MESSAGES[messageIndex % ATTENTION_MESSAGES.length];
  }, [messageIndex]);

  const returnMessage = useMemo(() => {
    return RETURN_MESSAGES[returnMessageIndex % RETURN_MESSAGES.length];
  }, [returnMessageIndex]);

  // Play attention sound when going ghostly
  useEffect(() => {
    if (currentState === 'ghostly-jumping') {
      import('@/utils/soundEffects').then(({ playRandomAttentionSound }) => {
        playRandomAttentionSound(0.6);
      });
    }
  }, [currentState]);

  useEffect(() => {
    console.log('🦆 Duck received animation state:', animationState, 'Current internal state:', currentState);
    
    // Don't accept external state changes when in internal transition states
    if (currentState === 'fallen' || currentState === 'ghostly-jumping' || currentState === 'celebrating-return') {
      console.log('🦆 Ignoring external state change - duck is in special state:', currentState);
      return;
    }
    
    // Clear any existing fallen timeout when changing states
    if (fallenTimeout && animationState !== 'falling') {
      clearTimeout(fallenTimeout);
      setFallenTimeout(null);
    }
    
    // Only rotate message when transitioning INTO jumping state (not already jumping)
    if (animationState === 'jumping' && currentState !== 'jumping') {
      setMessageIndex(prev => prev + 1);
    }
    
    setCurrentState(animationState);

    // Trigger animation complete callbacks without playing sounds (sounds are handled in parent)
    switch (animationState) {
      case 'falling':
        console.log('🦆 Duck falling animation will complete in 1500ms, then transition to fallen');
        setTimeout(() => {
          console.log('🦆 Duck is now fallen (squished). Will go ghostly in 10s');
          setCurrentState('fallen');
          onStateChange?.('fallen'); // Notify parent
          
          // After 10 seconds of being fallen, transition to ghostly-jumping
          const ghostTimeout = setTimeout(() => {
            console.log('🦆 Duck going ghostly - been fallen for 10s!');
            setCurrentState('ghostly-jumping');
            onStateChange?.('ghostly-jumping'); // Notify parent
          }, 10000);
          setFallenTimeout(ghostTimeout);
        }, 1500);
        break;
      case 'climbing':
        console.log('🦆 Duck climbing animation will complete in 1800ms');
        setTimeout(() => onAnimationComplete?.(), 1800);
        break;
      case 'celebrating':
        console.log('🦆 Duck celebrating animation will complete in 2000ms');
        setTimeout(() => onAnimationComplete?.(), 2000);
        break;
      case 'celebrating-return':
        console.log('🦆 Duck celebrating return - 3 bounces over 3s');
        setReturnMessageIndex(prev => prev + 1); // Rotate message for celebration
        setTimeout(() => onAnimationComplete?.(), 3000);
        break;
    }
  }, [animationState, onAnimationComplete, onStateChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fallenTimeout) {
        clearTimeout(fallenTimeout);
      }
    };
  }, [fallenTimeout]);

  return (
    <div 
      className={`duck-container ${currentState}`}
      style={currentState === 'fallen' || currentState === 'ghostly-jumping' ? {
        pointerEvents: 'auto'
      } : undefined}
    >
      {/* Speech bubble for jumping/attention state */}
      {currentState === 'jumping' && (
        <div className="speech-bubble">
          {currentMessage}
        </div>
      )}
      {/* Speech bubble for ghostly jumping */}
      {currentState === 'ghostly-jumping' && (
        <div className="speech-bubble ghostly">
          {currentMessage}
        </div>
      )}
      {/* Speech bubble for celebrating return */}
      {currentState === 'celebrating-return' && (
        <div className="speech-bubble celebration">
          {returnMessage}
        </div>
      )}
      <style>{`
        .duck-container {
          position: relative;
          width: 30px;
          height: 30px;
        }

        .speech-bubble {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          color: #333;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          margin-bottom: 8px;
          animation: bubble-bounce 0.5s ease-in-out infinite alternate;
          z-index: 1000;
        }

        .speech-bubble::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid white;
        }

        @keyframes bubble-bounce {
          from {
            transform: translateX(-50%) translateY(0);
          }
          to {
            transform: translateX(-50%) translateY(-4px);
          }
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

        /* Falling Animation - DRAMATIC! Falls down entire viewport */
        @keyframes fall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg) scale(1);
          }
          15% {
            transform: translateY(100px) translateX(-30px) rotate(-120deg) scale(1.15);
          }
          35% {
            transform: translateY(250px) translateX(-20px) rotate(-240deg) scale(0.95);
          }
          55% {
            transform: translateY(450px) translateX(-40px) rotate(-360deg) scale(1.1);
          }
          75% {
            transform: translateY(650px) translateX(-25px) rotate(-480deg) scale(0.9);
          }
          90% {
            transform: translateY(800px) translateX(-35px) rotate(-540deg) scale(0.85);
          }
          100% {
            transform: translateY(calc(100vh + 100px)) translateX(-30px) rotate(-720deg) scale(0.7);
          }
        }

        .duck-container.falling {
          position: fixed !important;
          z-index: 9999 !important;
        }

        .duck-container.falling .duck {
          animation: fall 1.5s cubic-bezier(0.6, -0.28, 0.74, 0.5) forwards;
          filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4));
        }

        /* Climbing Animation - Scrambles back up from bottom of screen! */
        @keyframes climb {
          0% {
            transform: translateY(calc(100vh + 100px)) translateX(-60px) scale(0.4) rotate(-30deg);
            opacity: 0;
          }
          20% {
            transform: translateY(600px) translateX(-40px) scale(0.7) rotate(-15deg);
            opacity: 0.5;
          }
          40% {
            transform: translateY(350px) translateX(-25px) scale(0.9) rotate(-5deg);
            opacity: 0.75;
          }
          60% {
            transform: translateY(150px) translateX(-10px) scale(1.1) rotate(5deg);
            opacity: 0.9;
          }
          75% {
            transform: translateY(50px) translateX(-3px) scale(1.15) rotate(-3deg);
          }
          85% {
            transform: translateY(10px) translateX(0) scale(1.08) rotate(2deg);
          }
          95% {
            transform: translateY(-5px) translateX(0) scale(1.03) rotate(-1deg);
          }
          100% {
            transform: translateY(0) translateX(0) scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .duck-container.climbing {
          position: fixed !important;
          z-index: 9999 !important;
        }

        .duck-container.climbing .duck {
          animation: climb 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
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

        .duck-container.jumping .duck {
          animation: jump 0.6s ease-in-out infinite;
        }

        @keyframes jump {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .duck-container.idle .duck {
          animation: none;
        }

        /* Fallen State - Squished at bottom of viewport */
        .duck-container.fallen {
          position: fixed !important;
          bottom: 20px !important;
          left: 50% !important;
          transform: translateX(-50%) scaleY(0.4) scaleX(1.3) !important;
          opacity: 0.7;
          z-index: 9999 !important;
          margin: 0 !important;
          top: auto !important;
        }

        .duck-container.fallen .duck {
          animation: none;
        }

        /* Ghostly Jumping - Stays at bottom center where it fell */
        .duck-container.ghostly-jumping {
          position: fixed !important;
          bottom: 20px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          opacity: 1;
          z-index: 9999 !important;
          pointer-events: auto !important;
        }

        .duck-container.ghostly-jumping .duck {
          animation: ghostly-jump 0.5s ease-in-out infinite;
          cursor: pointer;
        }

        @keyframes ghostly-jump {
          0%, 100% { 
            transform: translateY(0) rotate(-5deg); 
          }
          50% { 
            transform: translateY(-25px) rotate(5deg); 
          }
        }

        /* Ghostly speech bubble - SAME as regular, white background */
        .speech-bubble.ghostly {
          background: white;
          color: #333;
          animation: bubble-bounce 0.5s ease-in-out infinite alternate;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        /* Celebrating Return - 3 enthusiastic bounces */
        .duck-container.celebrating-return .duck {
          animation: joyful-bounce 3s ease-in-out;
        }

        @keyframes joyful-bounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          5% { transform: translateY(-30px) rotate(-10deg); }
          10% { transform: translateY(0) rotate(0deg); }
          15% { transform: translateY(-5px) rotate(5deg); }
          20% { transform: translateY(0) rotate(0deg); }
          
          30% { transform: translateY(-35px) rotate(10deg); }
          40% { transform: translateY(0) rotate(0deg); }
          45% { transform: translateY(-5px) rotate(-5deg); }
          50% { transform: translateY(0) rotate(0deg); }
          
          60% { transform: translateY(-30px) rotate(-8deg); }
          70% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(3deg); }
          80% { transform: translateY(0) rotate(0deg); }
        }

        .speech-bubble.celebration {
          animation: bubble-bounce 0.4s ease-in-out infinite alternate;
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #000;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(255, 165, 0, 0.4);
        }

        @media (prefers-reduced-motion: reduce) {
          .duck-container .duck,
          .duck-container .duck-foot-left,
          .duck-container .duck-foot-right {
            animation: none !important;
          }
        }
      `}</style>
      
      <div className="duck pointer-events-auto" onClick={handleDuckClick} style={{ cursor: currentState === 'fallen' || currentState === 'ghostly-jumping' ? 'pointer' : 'pointer' }}>
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
