// Quick script to regenerate Jasmine's PE course
import { supabase } from '@/integrations/supabase/client';

export const regenerateJasminePE = async () => {
  const courseId = 'f8f353ab-e85d-4e97-a43b-e568c5643d81';
  
  const { data, error } = await supabase.functions.invoke('regenerate-pe-course', {
    body: { courseId }
  });

  if (error) {
    console.error('Error:', error);
    return { success: false, error };
  }

  console.log('Success:', data);
  return { success: true, data };
};
