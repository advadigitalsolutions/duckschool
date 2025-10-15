import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useActivitySession } from '@/hooks/useActivitySession';

interface FocusJourneyContextType {
  sessionId: string | null;
  isTracking: boolean;
}

const FocusJourneyContext = createContext<FocusJourneyContextType | undefined>(undefined);

export const useFocusJourney = () => {
  const context = useContext(FocusJourneyContext);
  if (!context) {
    throw new Error('useFocusJourney must be used within FocusJourneyProvider');
  }
  return context;
};

interface FocusJourneyProviderProps {
  children: ReactNode;
  studentId?: string;
}

export function FocusJourneyProvider({ children, studentId }: FocusJourneyProviderProps) {
  const { sessionId, createSession, endSession } = useActivitySession(studentId);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (studentId && !sessionId) {
      console.log('🚀 FocusJourneyProvider: Creating session for student', studentId);
      createSession();
      setIsTracking(true);
    }
  }, [studentId, sessionId, createSession]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        console.log('🧹 FocusJourneyProvider: Cleaning up session on unmount');
        endSession('manual');
      }
    };
  }, []);

  return (
    <FocusJourneyContext.Provider value={{ sessionId, isTracking }}>
      {children}
    </FocusJourneyContext.Provider>
  );
}
