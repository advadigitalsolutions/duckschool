export function SmartCoreLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 240"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fill: 'hsl(var(--primary))' }}
    >
      {/* Stem - thicker and more substantial */}
      <rect x="94" y="10" width="12" height="45" rx="3" />
      
      {/* Leaf */}
      <ellipse cx="120" cy="25" rx="18" ry="12" transform="rotate(25 120 25)" />
      
      {/* Main apple/brain body - left hemisphere */}
      <path d="M 100 55 
        C 60 55, 30 75, 30 110
        C 30 145, 50 175, 75 185
        C 85 190, 95 185, 100 175
        L 100 55 Z" />
      
      {/* Main apple/brain body - right hemisphere */}
      <path d="M 100 55
        C 140 55, 170 75, 170 110
        C 170 145, 150 175, 125 185
        C 115 190, 105 185, 100 175
        L 100 55 Z" />
      
      {/* Center dividing line */}
      <line x1="100" y1="55" x2="100" y2="185" stroke="hsl(var(--background))" strokeWidth="3" />
      
      {/* Left brain pattern curves */}
      <path d="M 45 90 Q 55 85, 65 90 T 80 100" fill="none" stroke="hsl(var(--background))" strokeWidth="8" strokeLinecap="round" />
      <path d="M 50 110 Q 60 105, 70 110 T 85 120" fill="none" stroke="hsl(var(--background))" strokeWidth="8" strokeLinecap="round" />
      <path d="M 45 130 Q 55 125, 65 130 T 80 140" fill="none" stroke="hsl(var(--background))" strokeWidth="8" strokeLinecap="round" />
      <path d="M 55 150 Q 65 145, 75 150 T 90 160" fill="none" stroke="hsl(var(--background))" strokeWidth="8" strokeLinecap="round" />
      
      {/* Right brain pattern curves */}
      <path d="M 155 90 Q 145 85, 135 90 T 120 100" fill="none" stroke="hsl(var(--background))" strokeWidth="8" strokeLinecap="round" />
      <path d="M 150 110 Q 140 105, 130 110 T 115 120" fill="none" stroke="hsl(var(--background))" strokeWidth="8" strokeLinecap="round" />
      <path d="M 155 130 Q 145 125, 135 130 T 120 140" fill="none" stroke="hsl(var(--background))" strokeWidth="8" strokeLinecap="round" />
      <path d="M 145 150 Q 135 145, 125 150 T 110 160" fill="none" stroke="hsl(var(--background))" strokeWidth="8" strokeLinecap="round" />
      
      {/* Additional inner curves for detail */}
      <path d="M 65 95 Q 70 100, 75 105" fill="none" stroke="hsl(var(--background))" strokeWidth="6" strokeLinecap="round" />
      <path d="M 60 115 Q 65 120, 70 125" fill="none" stroke="hsl(var(--background))" strokeWidth="6" strokeLinecap="round" />
      <path d="M 135 95 Q 130 100, 125 105" fill="none" stroke="hsl(var(--background))" strokeWidth="6" strokeLinecap="round" />
      <path d="M 140 115 Q 135 120, 130 125" fill="none" stroke="hsl(var(--background))" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
