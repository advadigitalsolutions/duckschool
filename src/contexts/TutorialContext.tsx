import { createContext, useContext, useState, ReactNode } from 'react';

type TutorialType = 'focus_duck_wizard' | 'learning_wizard' | 'smart_calendar' | 'xp_system' | 'mastery_tracking' | null;

interface TutorialContextType {
  activeTutorial: TutorialType;
  openTutorial: (tutorial: TutorialType) => void;
  closeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
};

interface TutorialProviderProps {
  children: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const [activeTutorial, setActiveTutorial] = useState<TutorialType>(null);

  const openTutorial = (tutorial: TutorialType) => {
    setActiveTutorial(tutorial);
  };

  const closeTutorial = () => {
    setActiveTutorial(null);
  };

  return (
    <TutorialContext.Provider value={{ activeTutorial, openTutorial, closeTutorial }}>
      {children}
    </TutorialContext.Provider>
  );
}
