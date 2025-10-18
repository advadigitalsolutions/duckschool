import { useEffect, useState } from 'react';

type DuckPose = 'waving' | 'pointing' | 'celebrating' | 'confused' | 'wizard' | 'superhero';

interface DuckCharacterProps {
  pose?: DuckPose;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DuckCharacter({ pose = 'waving', size = 'md', className = '' }: DuckCharacterProps) {
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    // Idle bouncing animation
    const interval = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 600);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const getPoseTransform = () => {
    switch (pose) {
      case 'waving':
        return 'rotate-12';
      case 'pointing':
        return 'rotate-6';
      case 'celebrating':
        return 'scale-110';
      case 'confused':
        return '-rotate-12';
      case 'wizard':
        return '';
      case 'superhero':
        return 'rotate-3';
      default:
        return '';
    }
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${className} transition-all duration-200 ${
        bounce ? 'animate-bounce' : ''
      }`}
    >
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full transition-transform duration-300 ${getPoseTransform()}`}
      >
        {/* Duck body */}
        <ellipse cx="100" cy="120" rx="50" ry="55" fill="#FFD700" />
        
        {/* Duck head */}
        <circle cx="100" cy="70" r="35" fill="#FFD700" />
        
        {/* Duck beak */}
        <ellipse cx="115" cy="75" rx="12" ry="8" fill="#FF8C00" />
        
        {/* Duck eyes */}
        <circle cx="90" cy="65" r="5" fill="#000" />
        <circle cx="110" cy="65" r="5" fill="#000" />
        
        {/* Eye gleam */}
        <circle cx="92" cy="63" r="2" fill="#FFF" />
        <circle cx="112" cy="63" r="2" fill="#FFF" />
        
        {/* Duck feet */}
        <ellipse cx="85" cy="170" rx="15" ry="8" fill="#FF8C00" />
        <ellipse cx="115" cy="170" rx="15" ry="8" fill="#FF8C00" />
        
        {/* Pose-specific accessories */}
        {pose === 'wizard' && (
          <>
            {/* Wizard hat */}
            <path d="M 65 55 L 100 10 L 135 55 Z" fill="#8B4789" />
            <ellipse cx="100" cy="55" rx="35" ry="8" fill="#8B4789" />
            {/* Stars on hat */}
            <text x="95" y="35" fontSize="16" fill="#FFD700">✨</text>
          </>
        )}
        
        {pose === 'superhero' && (
          <>
            {/* Cape */}
            <path d="M 70 90 Q 50 120 60 160 L 75 100 Z" fill="#E53E3E" />
            <path d="M 130 90 Q 150 120 140 160 L 125 100 Z" fill="#E53E3E" />
          </>
        )}
        
        {pose === 'pointing' && (
          <>
            {/* Wing pointing */}
            <ellipse cx="140" cy="100" rx="20" ry="8" fill="#FFB700" transform="rotate(-30 140 100)" />
          </>
        )}
        
        {pose === 'waving' && (
          <>
            {/* Wing waving */}
            <ellipse cx="60" cy="90" rx="20" ry="8" fill="#FFB700" transform="rotate(45 60 90)" />
          </>
        )}
        
        {pose === 'celebrating' && (
          <>
            {/* Confetti */}
            <text x="50" y="40" fontSize="12">🎉</text>
            <text x="140" y="50" fontSize="12">✨</text>
            <text x="70" y="180" fontSize="12">⭐</text>
            <text x="130" y="175" fontSize="12">🎊</text>
          </>
        )}
        
        {pose === 'confused' && (
          <>
            {/* Question mark */}
            <text x="130" y="60" fontSize="24">❓</text>
          </>
        )}
      </svg>
    </div>
  );
}
