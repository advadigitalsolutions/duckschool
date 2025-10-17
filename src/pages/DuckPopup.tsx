import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FocusDuckSession } from '@/components/FocusDuckSession';
import { Button } from '@/components/ui/button';
import { Settings2, X } from 'lucide-react';

export default function DuckPopup() {
  const [searchParams] = useSearchParams();
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('studentId');
    setStudentId(id);
  }, [searchParams]);

  const handleOpenSettings = () => {
    window.open('/focus-tools', '_blank');
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-primary/5 p-4">
      <div className="relative">
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenSettings}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Duck Session */}
        <FocusDuckSession studentId={studentId} compact />
      </div>
    </div>
  );
}
