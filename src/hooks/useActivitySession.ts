import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SessionData {
  sessionId: string | null;
  activeSeconds: number;
  idleSeconds: number;
  awaySeconds: number;
  researchSeconds: number;
}

export const useActivitySession = (studentId?: string) => {
  const [sessionData, setSessionData] = useState<SessionData>({
    sessionId: null,
    activeSeconds: 0,
    idleSeconds: 0,
    awaySeconds: 0,
    researchSeconds: 0
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
    
    // Check if we already have an active session
    if (sessionData.sessionId) {
      console.log('⚠️ Session already exists, not creating duplicate:', sessionData.sessionId);
      return;
    }
    
    const POMODORO_DURATION = 25 * 60 * 1000; // 25 minutes in milliseconds
    const now = new Date();
    
    // Check for an active Pomodoro block (started within last 25 minutes and not ended)
    try {
      const twentyFiveMinutesAgo = new Date(now.getTime() - POMODORO_DURATION).toISOString();
      const { data: activeBlock } = await supabase
        .from('learning_sessions')
        .select('id, pomodoro_block_start, total_active_seconds, total_idle_seconds, total_away_seconds, total_research_seconds')
        .eq('student_id', studentId)
        .is('session_end', null)
        .gte('pomodoro_block_start', twentyFiveMinutesAgo)
        .order('pomodoro_block_start', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (activeBlock) {
        console.log('♻️ Resuming active Pomodoro block:', activeBlock.id);
        setSessionData({
          sessionId: activeBlock.id,
          activeSeconds: activeBlock.total_active_seconds || 0,
          idleSeconds: activeBlock.total_idle_seconds || 0,
          awaySeconds: activeBlock.total_away_seconds || 0,
          researchSeconds: activeBlock.total_research_seconds || 0
        });
        
        // Store in localStorage for crash recovery
        localStorage.setItem('focus_journey_session', JSON.stringify({
          sessionId: activeBlock.id,
          pomodoroBlockStart: activeBlock.pomodoro_block_start
        }));
        return;
      }
    } catch (e) {
      console.error('Error checking for active Pomodoro block:', e);
    }
    
    // Close any old sessions that exceeded 25 minutes
    try {
      const { data: oldSessions } = await supabase
        .from('learning_sessions')
        .select('id, pomodoro_block_start')
        .eq('student_id', studentId)
        .is('session_end', null)
        .not('pomodoro_block_start', 'is', null);
      
      if (oldSessions && oldSessions.length > 0) {
        const expiredSessions = oldSessions.filter(s => {
          const blockStart = new Date(s.pomodoro_block_start!);
          return now.getTime() - blockStart.getTime() > POMODORO_DURATION;
        });
        
        if (expiredSessions.length > 0) {
          console.log(`🧹 Closing ${expiredSessions.length} expired Pomodoro block(s)`);
          await supabase
            .from('learning_sessions')
            .update({
              session_end: now.toISOString(),
              ended_by: 'block_complete',
              is_block_complete: true
            })
            .in('id', expiredSessions.map(s => s.id));
        }
      }
    } catch (e) {
      console.error('Error closing expired sessions:', e);
    }
    
    // Check localStorage for session recovery
    const storedSession = localStorage.getItem('focus_journey_session');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        if (parsed.pomodoroBlockStart) {
          const blockStart = new Date(parsed.pomodoroBlockStart);
          // If block started within last 25 minutes, try to resume
          if (now.getTime() - blockStart.getTime() < POMODORO_DURATION) {
            const { data: existingSession } = await supabase
              .from('learning_sessions')
              .select('id, total_active_seconds, total_idle_seconds, total_away_seconds, total_research_seconds')
              .eq('id', parsed.sessionId)
              .is('session_end', null)
              .maybeSingle();
            
            if (existingSession) {
              console.log('🔄 Recovered session from crash:', existingSession.id);
              setSessionData({
                sessionId: existingSession.id,
                activeSeconds: existingSession.total_active_seconds || 0,
                idleSeconds: existingSession.total_idle_seconds || 0,
                awaySeconds: existingSession.total_away_seconds || 0,
                researchSeconds: existingSession.total_research_seconds || 0
              });
              return;
            }
          }
        }
        // Old or invalid session, remove it
        localStorage.removeItem('focus_journey_session');
      } catch (e) {
        console.error('Error recovering session:', e);
        localStorage.removeItem('focus_journey_session');
      }
    }
    
    // Create new Pomodoro block
    const { deviceType, browser } = getDeviceInfo();
    const pomodoroBlockStart = now.toISOString();
    
    console.log('✨ Creating new Pomodoro block for student:', studentId);
    const { data, error } = await supabase
      .from('learning_sessions')
      .insert({
        student_id: studentId,
        device_type: deviceType,
        browser: browser,
        pomodoro_block_start: pomodoroBlockStart,
        total_active_seconds: 0,
        total_idle_seconds: 0,
        total_away_seconds: 0,
        total_research_seconds: 0,
        is_block_complete: false
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating Pomodoro block:', error);
      return;
    }
    
    if (data) {
      console.log('✅ Pomodoro block created:', data.id);
      setSessionData(prev => ({ ...prev, sessionId: data.id }));
      
      // Log session_start event
      await supabase.from('activity_events').insert({
        student_id: studentId,
        session_id: data.id,
        event_type: 'session_start',
        metadata: { deviceType, browser, pomodoroBlockStart }
      });
      
      // Store in localStorage for crash recovery
      localStorage.setItem('focus_journey_session', JSON.stringify({
        sessionId: data.id,
        pomodoroBlockStart
      }));
    }
  }, [studentId, sessionData.sessionId]);

  const endSession = useCallback(async (endedBy: 'logout' | 'browser_close' | 'timeout' | 'manual' | 'block_complete' = 'manual') => {
    if (!sessionData.sessionId || !studentId) return;
    
    const totalSeconds = sessionData.activeSeconds + sessionData.idleSeconds + sessionData.awaySeconds + sessionData.researchSeconds;
    const POMODORO_DURATION_SECONDS = 25 * 60; // 25 minutes in seconds
    const isComplete = totalSeconds >= POMODORO_DURATION_SECONDS;
    
    await supabase
      .from('learning_sessions')
      .update({
        session_end: new Date().toISOString(),
        ended_by: endedBy,
        total_active_seconds: sessionData.activeSeconds,
        total_idle_seconds: sessionData.idleSeconds,
        total_away_seconds: sessionData.awaySeconds,
        total_research_seconds: sessionData.researchSeconds,
        is_block_complete: isComplete
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
        total_research_seconds: sessionData.researchSeconds,
        ended_by: endedBy,
        is_block_complete: isComplete
      }
    });
    
    localStorage.removeItem('focus_journey_session');
    setSessionData({ sessionId: null, activeSeconds: 0, idleSeconds: 0, awaySeconds: 0, researchSeconds: 0 });
  }, [sessionData, studentId]);

  const syncSession = useCallback(async () => {
    if (!sessionData.sessionId) return;
    
    const totalSeconds = sessionData.activeSeconds + sessionData.idleSeconds + sessionData.awaySeconds + sessionData.researchSeconds;
    console.log(`🔄 Syncing session ${sessionData.sessionId}:`, {
      active: sessionData.activeSeconds,
      idle: sessionData.idleSeconds,
      away: sessionData.awaySeconds,
      research: sessionData.researchSeconds,
      total: totalSeconds
    });
    
    const { error } = await supabase
      .from('learning_sessions')
      .update({
        total_active_seconds: sessionData.activeSeconds,
        total_idle_seconds: sessionData.idleSeconds,
        total_away_seconds: sessionData.awaySeconds,
        total_research_seconds: sessionData.researchSeconds
      })
      .eq('id', sessionData.sessionId);
      
    if (error) {
      console.error('❌ Error syncing session:', error);
    } else {
      console.log('✅ Session synced successfully');
    }
  }, [sessionData]);

  const updateActiveTime = useCallback((seconds: number) => {
    setSessionData(prev => {
      const newActive = prev.activeSeconds + seconds;
      if (newActive % 10 === 0) { // Log every 10 seconds
        console.log(`⏱️ Active time updated: ${newActive}s`);
      }
      return {
        ...prev,
        activeSeconds: newActive
      };
    });
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

  const updateResearchTime = useCallback((seconds: number) => {
    setSessionData(prev => ({
      ...prev,
      researchSeconds: prev.researchSeconds + seconds
    }));
  }, []);

  // Periodic sync to DB - every 10 seconds for more frequent updates
  useEffect(() => {
    if (!sessionData.sessionId) return;
    
    const interval = setInterval(syncSession, 10000); // Sync every 10 seconds
    return () => clearInterval(interval);
  }, [sessionData.sessionId, syncSession]);
  
  // Debounced sync after time updates
  useEffect(() => {
    if (!sessionData.sessionId) return;
    
    const timeout = setTimeout(() => {
      syncSession();
    }, 2000); // Sync 2 seconds after last time update
    
    return () => clearTimeout(timeout);
  }, [sessionData.activeSeconds, sessionData.idleSeconds, sessionData.awaySeconds, sessionData.researchSeconds, syncSession]);

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionData.sessionId) {
        // Use navigator.sendBeacon for reliable sync on page unload
        const updateData = {
          session_end: new Date().toISOString(),
          ended_by: 'browser_close',
          total_active_seconds: sessionData.activeSeconds,
          total_idle_seconds: sessionData.idleSeconds,
          total_away_seconds: sessionData.awaySeconds,
          total_research_seconds: sessionData.researchSeconds
        };
        
        // Fallback to synchronous update
        supabase
          .from('learning_sessions')
          .update(updateData)
          .eq('id', sessionData.sessionId);
          
        localStorage.removeItem('focus_journey_session');
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionData]);
  
  // End session on component unmount
  useEffect(() => {
    return () => {
      if (sessionData.sessionId) {
        endSession('manual');
      }
    };
  }, []);

  return {
    sessionId: sessionData.sessionId,
    createSession,
    endSession,
    updateActiveTime,
    updateIdleTime,
    updateAwayTime,
    updateResearchTime,
    sessionData
  };
};
