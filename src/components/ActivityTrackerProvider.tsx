import { useEffect } from 'react';
import { useMouseActivityTracker } from '@/hooks/useMouseActivityTracker';

interface ActivityTrackerProviderProps {
  studentId?: string;
  children: React.ReactNode;
}

export function ActivityTrackerProvider({ studentId, children }: ActivityTrackerProviderProps) {
  // This hook handles all the tracking logic internally
  useMouseActivityTracker({
    studentId,
    idleTimeoutSeconds: 60,
    syncIntervalSeconds: 30
  });

  return <>{children}</>;
}
