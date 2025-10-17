import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const mantras = [
  "I am unstoppable",
  "Let's crush this",
  "Time to shine",
  "I've got this",
  "Ready to conquer",
  "Bringing my best",
  "Nothing can stop me",
  "Let's make magic",
  "Power mode activated",
  "Born to succeed"
];

export function ExcitingAgendaButton() {
  const navigate = useNavigate();
  const [currentMantraIndex, setCurrentMantraIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMantraIndex((prev) => (prev + 1) % mantras.length);
    }, 60000); // Change every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center">
      <button
        onClick={() => navigate('/student/agenda')}
        className="group relative overflow-hidden rounded-2xl px-12 py-6 text-lg font-bold transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 animate-gradient bg-[length:200%_200%]" />
        
        {/* Glowing animated border effect */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-[-2px] rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-spin-slow blur-sm" />
        </div>

        {/* Moving glow effects behind button */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute -inset-[100%] animate-spin-very-slow bg-gradient-conic from-transparent via-white/20 to-transparent" />
        </div>

        {/* Button content */}
        <div className="relative z-10 flex items-center gap-3 text-white">
          <span className="transition-all duration-300 group-hover:scale-110">
            {mantras[currentMantraIndex]}
          </span>
          <ChevronRight className="h-6 w-6 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-125" />
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12" />
      </button>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-very-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes gradient-conic {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animate-spin-very-slow {
          animation: spin-very-slow 8s linear infinite;
        }
        
        .bg-gradient-conic {
          background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }
      `}</style>
    </div>
  );
}
