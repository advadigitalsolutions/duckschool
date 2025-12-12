import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { debounce } from 'lodash';

interface MouseActivityTrackerOptions {
  studentId?: string;
  idleTimeoutSeconds?: number;
  syncIntervalSeconds?: number;
}

export function useMouseActivityTracker({
  studentId,
  idleTimeoutSeconds = 60,
  syncIntervalSeconds = 30
}: MouseActivityTrackerOptions = {}) {
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const isIdleRef = useRef(false);
  const activeSecondsRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync active time to database
  const syncToDatabase = useCallback(async () => {
    if (!studentId || activeSecondsRef.current === 0) return;

    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Check if record exists for today
      const { data: existing } = await supabase
        .from('daily_activity_minutes')
        .select('id, active_seconds')
        .eq('student_id', studentId)
        .eq('date', today)
        .single();

      if (existing) {
        // Update existing record
        await supabase
          .from('daily_activity_minutes')
          .update({ 
            active_seconds: existing.active_seconds + activeSecondsRef.current,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Insert new record
        await supabase
          .from('daily_activity_minutes')
          .insert({
            student_id: studentId,
            date: today,
            active_seconds: activeSecondsRef.current
          });
      }

      // Reset the counter after successful sync
      activeSecondsRef.current = 0;
      setActiveSeconds(0);
    } catch (error) {
      console.error('Error syncing activity time:', error);
    }
  }, [studentId]);

  // Handle mouse movement
  const handleMouseMove = useCallback(
    debounce(() => {
      lastActivityRef.current = Date.now();
      if (isIdleRef.current) {
        isIdleRef.current = false;
      }
    }, 100),
    []
  );

  // Start tracking
  const startTracking = useCallback(() => {
    if (isTracking || !studentId) return;

    setIsTracking(true);
    lastActivityRef.current = Date.now();
    isIdleRef.current = false;

    // Add mouse move listener
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseMove);
    window.addEventListener('keydown', handleMouseMove);
    window.addEventListener('scroll', handleMouseMove);
    window.addEventListener('touchstart', handleMouseMove);

    // Interval to count active seconds
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = (now - lastActivityRef.current) / 1000;

      if (timeSinceActivity >= idleTimeoutSeconds) {
        // User is idle
        isIdleRef.current = true;
      } else if (!isIdleRef.current) {
        // User is active, increment counter
        activeSecondsRef.current += 1;
        setActiveSeconds(prev => prev + 1);
      }
    }, 1000);

    // Sync to database periodically
    syncIntervalRef.current = setInterval(() => {
      syncToDatabase();
    }, syncIntervalSeconds * 1000);
  }, [studentId, isTracking, handleMouseMove, idleTimeoutSeconds, syncIntervalSeconds, syncToDatabase]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);

    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mousedown', handleMouseMove);
    window.removeEventListener('keydown', handleMouseMove);
    window.removeEventListener('scroll', handleMouseMove);
    window.removeEventListener('touchstart', handleMouseMove);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    // Final sync before stopping
    syncToDatabase();
  }, [handleMouseMove, syncToDatabase]);

  // Auto-start when studentId is available
  useEffect(() => {
    if (studentId) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [studentId]);

  // Sync on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      syncToDatabase();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [syncToDatabase]);

  return {
    activeSeconds,
    isTracking,
    isIdle: isIdleRef.current,
    startTracking,
    stopTracking
  };
}
