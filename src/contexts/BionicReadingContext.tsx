import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BionicReadingContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  loading: boolean;
}

const BionicReadingContext = createContext<BionicReadingContextType>({
  enabled: false,
  setEnabled: () => {},
  loading: true,
});

export const useBionicReading = () => useContext(BionicReadingContext);

export function BionicReadingProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBionicReadingSetting();
  }, []);

  const fetchBionicReadingSetting = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('students')
        .select('bionic_reading_enabled')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setEnabledState(data.bionic_reading_enabled || false);
      }
    } catch (error) {
      console.error('Error fetching bionic reading setting:', error);
    } finally {
      setLoading(false);
    }
  };

  const setEnabled = async (newEnabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (student) {
        await supabase
          .from('students')
          .update({ bionic_reading_enabled: newEnabled })
          .eq('id', student.id);

        setEnabledState(newEnabled);
      }
    } catch (error) {
      console.error('Error updating bionic reading setting:', error);
    }
  };

  return (
    <BionicReadingContext.Provider value={{ enabled, setEnabled, loading }}>
      {children}
    </BionicReadingContext.Provider>
  );
}
