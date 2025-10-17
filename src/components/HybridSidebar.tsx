import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StudentSidebar } from './StudentSidebar';
import { EducatorSidebar } from './EducatorSidebar';
import { GraduationCap, Users } from 'lucide-react';

export function HybridSidebar() {
  const [mode, setMode] = useState<'learning' | 'planning'>('learning');

  return (
    <div className="relative">
      {/* Mode Toggle */}
      <div className="sticky top-0 z-10 bg-background border-b p-2">
        <div className="flex gap-2">
          <Button
            variant={mode === 'learning' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('learning')}
            className="flex-1"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Learning
          </Button>
          <Button
            variant={mode === 'planning' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('planning')}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Planning
          </Button>
        </div>
      </div>

      {/* Render appropriate sidebar based on mode */}
      {mode === 'learning' ? <StudentSidebar /> : <EducatorSidebar />}
    </div>
  );
}
