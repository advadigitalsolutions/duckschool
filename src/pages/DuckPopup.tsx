import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FocusDuckSession } from '@/components/FocusDuckSession';

export default function DuckPopup() {
  const [searchParams] = useSearchParams();
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('studentId');
    setStudentId(id);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-primary/5 p-4">
      <FocusDuckSession studentId={studentId} compact />
    </div>
  );
}
