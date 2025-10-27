import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FocusDuckSession } from '@/components/FocusDuckSession';

export default function DuckPopup() {
  const [searchParams] = useSearchParams();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = () => {
      const id = searchParams.get('studentId');
      setStudentId(id);
      // Give a moment for rendering
      setTimeout(() => setLoading(false), 100);
    };
    init();
  }, [searchParams]);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-accent/5 via-background to-primary/5 overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-2xl font-semibold mb-4">Loading Focus Duck...</div>
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      ) : (
        <FocusDuckSession studentId={studentId} compact />
      )}
    </div>
  );
}
