import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FrameworkOption {
  value: string;
  label: string;
  standardCount: number;
}

export function useAvailableFrameworks() {
  const [frameworks, setFrameworks] = useState<FrameworkOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFrameworks();
  }, []);

  const loadFrameworks = async () => {
    try {
      setLoading(true);
      
      // Get distinct frameworks with their standard counts
      const { data, error } = await supabase
        .from('standards')
        .select('framework')
        .order('framework');

      if (error) throw error;

      // Count standards per framework
      const frameworkCounts = (data || []).reduce((acc: Record<string, number>, item) => {
        acc[item.framework] = (acc[item.framework] || 0) + 1;
        return acc;
      }, {});

      // Create framework options
      const frameworkOptions: FrameworkOption[] = Object.entries(frameworkCounts)
        .map(([value, count]) => ({
          value,
          label: getFrameworkLabel(value),
          standardCount: count
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      // Always add Custom Framework option at the end
      frameworkOptions.push({
        value: 'CUSTOM',
        label: 'Custom Framework (Goals-Based)',
        standardCount: 0
      });

      setFrameworks(frameworkOptions);
    } catch (error) {
      console.error('Error loading frameworks:', error);
      // Fallback to just custom option
      setFrameworks([{
        value: 'CUSTOM',
        label: 'Custom Framework (Goals-Based)',
        standardCount: 0
      }]);
    } finally {
      setLoading(false);
    }
  };

  return { frameworks, loading, reload: loadFrameworks };
}

// Helper to generate user-friendly labels from framework codes
function getFrameworkLabel(frameworkCode: string): string {
  // Handle common patterns
  if (frameworkCode === 'CA CCSS') return 'California Common Core State Standards';
  if (frameworkCode === 'CA-CCSS') return 'California Common Core State Standards';
  if (frameworkCode === 'CCSS') return 'Common Core State Standards';
  if (frameworkCode === 'TX-TEKS') return 'Texas Essential Knowledge and Skills';
  if (frameworkCode === 'FL-BEST') return 'Florida B.E.S.T. Standards';
  if (frameworkCode === 'NY-CCLS') return 'New York Common Core Learning Standards';
  
  // Default: capitalize and format nicely
  return frameworkCode
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Utility function to get display name for any framework code
export function getFrameworkDisplayName(frameworkCode: string | undefined): string {
  if (!frameworkCode) return 'Not configured';
  if (frameworkCode === 'CUSTOM') return 'Custom Framework (Goals-Based)';
  return getFrameworkLabel(frameworkCode);
}
