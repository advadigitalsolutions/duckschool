export function SmartCoreLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Brain-Apple hybrid shape */}
      <g className="fill-primary">
        {/* Left brain hemisphere */}
        <path d="M35 30 C25 30, 20 35, 20 45 C20 55, 25 65, 30 70 C32 72, 35 73, 38 72 C40 71, 42 69, 43 66 C44 63, 44 60, 45 57 C46 54, 47 51, 48 50 C49 48, 50 47, 50 45 C50 42, 48 38, 45 35 C42 32, 38 30, 35 30 Z" />
        
        {/* Right brain hemisphere */}
        <path d="M65 30 C75 30, 80 35, 80 45 C80 55, 75 65, 70 70 C68 72, 65 73, 62 72 C60 71, 58 69, 57 66 C56 63, 56 60, 55 57 C54 54, 53 51, 52 50 C51 48, 50 47, 50 45 C50 42, 52 38, 55 35 C58 32, 62 30, 65 30 Z" />
        
        {/* Brain wrinkles - left side */}
        <path d="M28 45 C30 43, 32 43, 34 45 C36 47, 36 49, 34 51 C32 53, 30 53, 28 51 C26 49, 26 47, 28 45 Z" />
        <path d="M30 55 C32 53, 34 53, 36 55 C38 57, 38 59, 36 61 C34 63, 32 63, 30 61 C28 59, 28 57, 30 55 Z" />
        <path d="M38 50 C40 48, 42 48, 44 50 C46 52, 46 54, 44 56 C42 58, 40 58, 38 56 C36 54, 36 52, 38 50 Z" />
        
        {/* Brain wrinkles - right side */}
        <path d="M72 45 C70 43, 68 43, 66 45 C64 47, 64 49, 66 51 C68 53, 70 53, 72 51 C74 49, 74 47, 72 45 Z" />
        <path d="M70 55 C68 53, 66 53, 64 55 C62 57, 62 59, 64 61 C66 63, 68 63, 70 61 C72 59, 72 57, 70 55 Z" />
        <path d="M62 50 C60 48, 58 48, 56 50 C54 52, 54 54, 56 56 C58 58, 60 58, 62 56 C64 54, 64 52, 62 50 Z" />
        
        {/* Bottom rounded connection */}
        <path d="M30 70 C35 75, 45 78, 50 78 C55 78, 65 75, 70 70" />
        
        {/* Stem - thicker and more substantial */}
        <path d="M50 30 C50 25, 50 20, 50 15 C50 13, 51 12, 52 12 C53 12, 54 13, 54 15 C54 20, 54 25, 54 30" strokeWidth="2" className="stroke-primary fill-primary" />
        
        {/* Leaf - more elegant */}
        <path d="M52 15 C52 15, 58 12, 62 14 C64 15, 64 17, 62 19 C60 21, 56 20, 54 18 C53 17, 52 16, 52 15 Z" />
      </g>
    </svg>
  );
}
