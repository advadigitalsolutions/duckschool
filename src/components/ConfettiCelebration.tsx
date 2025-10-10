import { useEffect, useState } from 'react';

interface Confetti {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  velocity: { x: number; y: number };
  rotationSpeed: number;
  type: 'confetti' | 'coin';
}

export function ConfettiCelebration({ active, onComplete }: { active: boolean; onComplete: () => void }) {
  const [particles, setParticles] = useState<Confetti[]>([]);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      setShowText(false);
      return;
    }

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F06292', '#AED581'];
    const newParticles: Confetti[] = [];

    // Create exploding confetti (200 pieces from center)
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    for (let i = 0; i < 200; i++) {
      const angle = (Math.PI * 2 * i) / 200;
      const speed = 15 + Math.random() * 20;
      newParticles.push({
        id: i,
        x: centerX,
        y: centerY,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - Math.random() * 5,
        },
        rotationSpeed: (Math.random() - 0.5) * 20,
        type: 'confetti',
      });
    }

    // Create 8-bit coins (50 coins from top)
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: 200 + i,
        x: Math.random() * window.innerWidth,
        y: -50 - Math.random() * 100,
        rotation: 0,
        color: '#FFD700',
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: 3 + Math.random() * 4,
        },
        rotationSpeed: 0,
        type: 'coin',
      });
    }

    setParticles(newParticles);
    setShowText(true);

    const animationDuration = 4000;
    const frameRate = 60;
    const totalFrames = (animationDuration / 1000) * frameRate;
    let currentFrame = 0;

    const interval = setInterval(() => {
      currentFrame++;
      
      setParticles(prev =>
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.velocity.x,
          y: particle.y + particle.velocity.y,
          rotation: particle.rotation + particle.rotationSpeed,
          velocity: {
            x: particle.velocity.x * 0.98,
            y: particle.velocity.y + (particle.type === 'coin' ? 0.2 : 0.3), // Gravity
          },
        })).filter(p => p.y < window.innerHeight + 100)
      );

      if (currentFrame >= totalFrames) {
        clearInterval(interval);
        setTimeout(() => {
          setParticles([]);
          setShowText(false);
          onComplete();
        }, 500);
      }
    }, 1000 / frameRate);

    return () => clearInterval(interval);
  }, [active, onComplete]);

  if (particles.length === 0 && !showText) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(particle => (
        particle.type === 'confetti' ? (
          <div
            key={particle.id}
            className="absolute w-3 h-3 transition-transform"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              backgroundColor: particle.color,
              transform: `rotate(${particle.rotation}deg)`,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            }}
          />
        ) : (
          <div
            key={particle.id}
            className="absolute w-6 h-6"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            }}
          />
        )
      ))}
      
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="text-center animate-scale-in"
            style={{
              animation: 'flash 0.5s ease-in-out infinite alternate',
            }}
          >
            <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 mb-4 drop-shadow-2xl">
              You did it!!
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes flash {
          0%, 100% { 
            opacity: 1;
            transform: scale(1) rotate(-2deg);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.1) rotate(2deg);
          }
        }
      `}</style>
    </div>
  );
}