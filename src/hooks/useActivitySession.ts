import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionData {
  sessionId: string | null;
  activeSeconds: number;
  idleSeconds: number;
  awaySeconds: number;
}

export const useActivitySession = (studentId?: string) => {
  const [sessionData, setSessionData] = useState<SessionData>({
    sessionId: null,
    activeSeconds: 0,
    idleSeconds: 0,
    awaySeconds: 0
  });

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let deviceType = 'desktop';
    if (/Mobile|Android|iPhone/i.test(ua)) deviceType = 'mobile';
    else if (/Tablet|iPad/i.test(ua)) deviceType = 'tablet';
    
    let browser = 'unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    return { deviceType, browser };
  };

  const createSession = useCallback(async () => {
    if (!studentId) return;
    
    const { deviceType, browser } = getDeviceInfo();
    
    const { data, error } = await supabase
      .from('learning_sessions')
      .insert({
        student_id: studentId,
        device_type: deviceType,
        browser: browser,
        total_active_seconds: 0,
        total_idle_seconds: 0,
        total_away_seconds: 0
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating session:', error);
      return;
    }
    
    if (data) {
      setSessionData(prev => ({ ...prev, sessionId: data.id }));
      
      // Log session_start event
      await supabase.from('activity_events').insert({
        student_id: studentId,
        session_id: data.id,
        event_type: 'session_start',
        metadata: { deviceType, browser }
      });
      
      // Store in localStorage for recovery
      localStorage.setItem('focus_journey_session', JSON.stringify({
        sessionId: data.id,
        startTime: new Date().toISOString()
      }));
    }
  }, [studentId]);

  const endSession = useCallback(async (endedBy: 'logout' | 'browser_close' | 'timeout' | 'manual' = 'manual') => {
    if (!sessionData.sessionId || !studentId) return;
    
    await supabase
      .from('learning_sessions')
      .update({
        session_end: new Date().toISOString(),
        ended_by: endedBy,
        total_active_seconds: sessionData.activeSeconds,
        total_idle_seconds: sessionData.idleSeconds,
        total_away_seconds: sessionData.awaySeconds
      })
      .eq('id', sessionData.sessionId);
    
    await supabase.from('activity_events').insert({
      student_id: studentId,
      session_id: sessionData.sessionId,
      event_type: 'session_end',
      metadata: {
        total_active_seconds: sessionData.activeSeconds,
        total_idle_seconds: sessionData.idleSeconds,
        total_away_seconds: sessionData.awaySeconds,
        ended_by: endedBy
      }
    });
    
    localStorage.removeItem('focus_journey_session');
    setSessionData({ sessionId: null, activeSeconds: 0, idleSeconds: 0, awaySeconds: 0 });
  }, [sessionData, studentId]);

  const syncSession = useCallback(async () => {
    if (!sessionData.sessionId) return;
    
    await supabase
      .from('learning_sessions')
      .update({
        total_active_seconds: sessionData.activeSeconds,
        total_idle_seconds: sessionData.idleSeconds,
        total_away_seconds: sessionData.awaySeconds
      })
      .eq('id', sessionData.sessionId);
  }, [sessionData]);

  const updateActiveTime = useCallback((seconds: number) => {
    setSessionData(prev => ({
      ...prev,
      activeSeconds: prev.activeSeconds + seconds
    }));
  }, []);

  const updateIdleTime = useCallback((seconds: number) => {
    setSessionData(prev => ({
      ...prev,
      idleSeconds: prev.idleSeconds + seconds
    }));
  }, []);

  const updateAwayTime = useCallback((seconds: number) => {
    setSessionData(prev => ({
      ...prev,
      awaySeconds: prev.awaySeconds + seconds
    }));
  }, []);

  // Periodic sync to DB
  useEffect(() => {
    if (!sessionData.sessionId) return;
    
    const interval = setInterval(syncSession, 30000); // Sync every 30 seconds
    return () => clearInterval(interval);
  }, [sessionData.sessionId, syncSession]);

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (sessionData.sessionId) {
        // Use simple update instead of sendBeacon since we can't access protected URL
        await supabase
          .from('learning_sessions')
          .update({
            session_end: new Date().toISOString(),
            ended_by: 'browser_close',
            total_active_seconds: sessionData.activeSeconds,
            total_idle_seconds: sessionData.idleSeconds,
            total_away_seconds: sessionData.awaySeconds
          })
          .eq('id', sessionData.sessionId);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionData]);

  return {
    sessionId: sessionData.sessionId,
    createSession,
    endSession,
    updateActiveTime,
    updateIdleTime,
    updateAwayTime,
    sessionData
  };
};
