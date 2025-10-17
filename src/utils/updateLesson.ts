import { supabase } from "@/integrations/supabase/client";

/**
 * One-time utility to update the micro-fiction lesson with complete content
 * Run this once to populate all missing materials
 */
export async function updateMicroFictionLesson() {
  try {
    console.log('Calling update-lesson-content function...');
    
    const { data, error } = await supabase.functions.invoke('update-lesson-content', {
      body: {}
    });

    if (error) {
      console.error('Error updating lesson:', error);
      return { success: false, error };
    }

    console.log('Lesson updated successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error };
  }
}

// Auto-execute on import (will run once when the app loads)
// Comment this out after first successful run
updateMicroFictionLesson().then(result => {
  if (result.success) {
    console.log('✅ Micro-Fiction lesson now includes:');
    console.log('  - 3 complete example scenes (sci-fi, fantasy, contemporary)');
    console.log('  - Self-editing checklist with 5 strategies');
    console.log('  - Clear submission instructions');
    console.log('  - Visual progress tracker');
    console.log('  - 3 pre-selected research links');
    console.log('  - Annotated sample student response');
    console.log('  - Enhanced bridge support with transformation examples');
  } else {
    console.error('❌ Failed to update lesson:', result.error);
  }
});
