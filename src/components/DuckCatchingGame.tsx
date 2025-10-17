import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useXP } from '@/hooks/useXP';
import butterflyNetIcon from '@/assets/butterfly-net.png';

interface DuckCatchingGameProps {
  studentId: string;
  upNextAssignmentId?: string;
}

const funnyQuacks = [
  "You can't catch me! 🦆",
  "Too slow! 😝",
  "Quack quack! 🏃‍♂️",
  "Nice try! 🦆💨",
  "Almost! Keep trying! 😄",
  "I'm too fast! ⚡",
  "Nope! 🦆",
  "Gotta be quicker! 🏃",
];

export function DuckCatchingGame({ studentId, upNextAssignmentId }: DuckCatchingGameProps) {
  const navigate = useNavigate();
  const { awardXP } = useXP(studentId);
  const [isActive, setIsActive] = useState(false);
  const [duckPosition, setDuckPosition] = useState({ x: 50, y: 50 });
  const [duckVelocity, setDuckVelocity] = useState({ vx: 0, vy: 0 });
  const [showMessage, setShowMessage] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const duckRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      setDuckPosition((prev) => {
        let newX = prev.x + duckVelocity.vx;
        let newY = prev.y + duckVelocity.vy;
        let newVx = duckVelocity.vx;
        let newVy = duckVelocity.vy;

        // Bounce off walls with physics
        if (newX <= 0 || newX >= 95) {
          newVx = -newVx * 0.8;
          newX = newX <= 0 ? 0 : 95;
        }
        if (newY <= 0 || newY >= 90) {
          newVy = -newVy * 0.8;
          newY = newY <= 0 ? 0 : 90;
        }

        // Apply friction
        newVx *= 0.98;
        newVy *= 0.98;

        setDuckVelocity({ vx: newVx, vy: newVy });

        return { x: newX, y: newY };
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, duckVelocity]);

  const startGame = () => {
    setIsActive(true);
    setAttemptsLeft(Math.floor(Math.random() * 9) + 2); // Random 2-10
    setDuckPosition({ x: 50, y: 50 });
    setDuckVelocity({ vx: 2, vy: 1.5 });
    document.body.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Cpath d=\'M2,2 L2,12 L8,8 L12,16 L16,14 L12,6 L18,6 Z\' fill=\'%23666\'/%3E%3C/svg%3E") 4 4, auto';
  };

  const handleDuckClick = async () => {
    if (!isActive) return;

    // Play quack sound
    const quackSounds = Array.from({ length: 19 }, (_, i) => `/sounds/duck-click-${i + 1}.mp3`);
    const randomQuack = quackSounds[Math.floor(Math.random() * quackSounds.length)];
    const audio = new Audio(randomQuack);
    audio.volume = 0.5;
    audio.play();

    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 300);

    // Show random message
    const message = funnyQuacks[Math.floor(Math.random() * funnyQuacks.length)];
    setShowMessage(message);
    setTimeout(() => setShowMessage(''), 2000);

    if (attemptsLeft <= 1) {
      // Duck caught!
      setIsActive(false);
      document.body.style.cursor = 'auto';
      
      // Celebration sound
      const celebrateAudio = new Audio('/sounds/duck-celebrate.mp3');
      celebrateAudio.volume = 0.6;
      celebrateAudio.play();

      toast.success('🎉 You caught the Focus Duck! +10 XP');
      
      // Award XP
      await awardXP(10, 'mini_game', 'Caught the Focus Duck');

      // Navigate to assignment after a brief delay
      setTimeout(() => {
        if (upNextAssignmentId) {
          navigate(`/assignment/${upNextAssignmentId}`);
        }
      }, 1500);
    } else {
      setAttemptsLeft((prev) => prev - 1);
      // Make duck run in random direction
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 2;
      setDuckVelocity({
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
  };

  if (!isActive) {
    return (
      <button
        onClick={startGame}
        className="fixed bottom-8 right-8 p-3 bg-primary/10 hover:bg-primary/20 rounded-full hover:scale-110 transition-all duration-200 cursor-pointer z-50 shadow-lg border-2 border-primary/20"
        title="Catch the Focus Duck!"
      >
        <img src={butterflyNetIcon} alt="Butterfly net" className="w-8 h-8" />
      </button>
    );
  }

  return (
    <>
      <div
        ref={duckRef}
        onClick={handleDuckClick}
        className="fixed cursor-pointer z-50 transition-all duration-100"
        style={{
          left: `${duckPosition.x}%`,
          top: `${duckPosition.y}%`,
          transform: `
            translateX(-50%) 
            translateY(-50%) 
            ${isJumping ? 'translateY(-30px) scale(1.2)' : ''} 
            scaleX(${duckVelocity.vx < 0 ? -1 : 1})
          `,
        }}
      >
        <div className="relative">
          {/* Duck character with walking animation */}
          <div className="relative">
            <div className="text-6xl animate-waddle">
              🦆
            </div>
            
            {/* Running feet animation */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-run-left" />
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-run-right" />
            </div>
          </div>

          {/* Speech bubble - always on top */}
          {showMessage && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-black px-3 py-2 rounded-lg shadow-lg text-sm font-medium z-[100]">
              {showMessage}
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes waddle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }

        @keyframes run-left {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes run-right {
          0%, 100% { transform: translateY(-4px); }
          50% { transform: translateY(0); }
        }

        .animate-waddle {
          animation: waddle 0.2s ease-in-out infinite;
        }

        .animate-run-left {
          animation: run-left 0.15s ease-in-out infinite;
        }

        .animate-run-right {
          animation: run-right 0.15s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
