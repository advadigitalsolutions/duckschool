import { useEffect, useState } from 'react';

interface Confetti {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  velocity: { x: number; y: number };
  rotationSpeed: number;
}

export function ConfettiCelebration({ active, onComplete }: { active: boolean; onComplete: () => void }) {
  const [confetti, setConfetti] = useState<Confetti[]>([]);

  useEffect(() => {
    if (!active) {
      setConfetti([]);
      return;
    }

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const newConfetti: Confetti[] = [];

    // Create 100 confetti pieces
    for (let i = 0; i < 100; i++) {
      newConfetti.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocity: {
          x: (Math.random() - 0.5) * 10,
          y: Math.random() * 5 + 2,
        },
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    setConfetti(newConfetti);

    const animationDuration = 3000;
    const frameRate = 60;
    const totalFrames = (animationDuration / 1000) * frameRate;
    let currentFrame = 0;

    const interval = setInterval(() => {
      currentFrame++;
      
      setConfetti(prev =>
        prev.map(piece => ({
          ...piece,
          x: piece.x + piece.velocity.x,
          y: piece.y + piece.velocity.y,
          rotation: piece.rotation + piece.rotationSpeed,
          velocity: {
            x: piece.velocity.x * 0.99,
            y: piece.velocity.y + 0.1, // Gravity
          },
        }))
      );

      if (currentFrame >= totalFrames) {
        clearInterval(interval);
        setTimeout(() => {
          setConfetti([]);
          onComplete();
        }, 500);
      }
    }, 1000 / frameRate);

    return () => clearInterval(interval);
  }, [active, onComplete]);

  if (confetti.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confetti.map(piece => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 transition-transform"
          style={{
            left: `${piece.x}px`,
            top: `${piece.y}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="text-6xl font-bold text-primary mb-4 animate-bounce">
            🎉 Amazing Work! 🎉
          </div>
          <div className="text-2xl font-semibold text-foreground">
            You're crushing it! Keep going!
          </div>
        </div>
      </div>
    </div>
  );
}
