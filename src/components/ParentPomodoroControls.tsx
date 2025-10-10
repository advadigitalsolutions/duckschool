import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, RotateCcw, Clock, Coffee } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface PomodoroSession {
  id: string;
  student_id: string;
  time_left: number;
  is_running: boolean;
  is_break: boolean;
  sessions_completed: number;
  settings: any; // Using any to handle Json type from Supabase
}

export function ParentPomodoroControls() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Map<string, PomodoroSession>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    setupRealtimeSubscription();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch students
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, name, avatar_url')
        .eq('parent_id', user.id);

      if (studentsData) {
        setStudents(studentsData);

        // Fetch or create sessions for each student
        for (const student of studentsData) {
          const { data: sessionData } = await supabase
            .from('pomodoro_sessions')
            .select('*')
            .eq('student_id', student.id)
            .single();

          if (sessionData) {
            setSessions(prev => new Map(prev).set(student.id, sessionData));
          } else {
            // Create initial session
            const { data: newSession } = await supabase
              .from('pomodoro_sessions')
              .insert({
                student_id: student.id,
                time_left: 1500,
                is_running: false,
                is_break: false,
                sessions_completed: 0,
              })
              .select()
              .single();

            if (newSession) {
              setSessions(prev => new Map(prev).set(student.id, newSession));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load Pomodoro timers');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('pomodoro_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pomodoro_sessions'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const session = payload.new as PomodoroSession;
            setSessions(prev => new Map(prev).set(session.student_id, session));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateSession = async (studentId: string, updates: Partial<PomodoroSession>) => {
    const session = sessions.get(studentId);
    if (!session) return;

    const { error } = await supabase
      .from('pomodoro_sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('student_id', studentId);

    if (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update timer');
    }
  };

  const toggleTimer = (studentId: string) => {
    const session = sessions.get(studentId);
    if (!session) return;
    updateSession(studentId, { is_running: !session.is_running });
  };

  const resetTimer = (studentId: string) => {
    const session = sessions.get(studentId);
    if (!session) return;

    const duration = session.is_break
      ? (session.sessions_completed % session.settings.sessionsUntilLongBreak === 0
          ? session.settings.longBreakMinutes
          : session.settings.breakMinutes) * 60
      : session.settings.workMinutes * 60;

    updateSession(studentId, {
      time_left: duration,
      is_running: false,
    });
  };

  const updateSettings = async (studentId: string, settingKey: string, value: any) => {
    const session = sessions.get(studentId);
    if (!session) return;

    const newSettings = { ...session.settings, [settingKey]: value };
    await updateSession(studentId, { settings: newSettings });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Pomodoro Timers</CardTitle>
          <CardDescription>Add students to manage their focus timers</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Student Pomodoro Timers</CardTitle>
          <CardDescription>Manage and monitor your students' focus sessions</CardDescription>
        </CardHeader>
      </Card>

      {students.map((student) => {
        const session = sessions.get(student.id);
        if (!session) return null;

        return (
          <Card key={student.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={student.avatar_url || ''} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{student.name}</CardTitle>
                  <CardDescription>
                    {session.is_break ? <Coffee className="inline h-3 w-3 mr-1" /> : <Clock className="inline h-3 w-3 mr-1" />}
                    {session.is_break ? 'Break Time' : 'Focus Time'}
                  </CardDescription>
                </div>
                <div className="text-3xl font-bold tabular-nums">
                  {formatTime(session.time_left)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timer Controls */}
              <div className="flex gap-2">
                <Button
                  onClick={() => toggleTimer(student.id)}
                  variant={session.is_running ? "secondary" : "default"}
                  className="flex-1"
                >
                  {session.is_running ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start
                    </>
                  )}
                </Button>
                <Button onClick={() => resetTimer(student.id)} variant="outline">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Work Minutes</Label>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    value={session.settings.workMinutes}
                    onChange={(e) => updateSettings(student.id, 'workMinutes', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Break Minutes</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={session.settings.breakMinutes}
                    onChange={(e) => updateSettings(student.id, 'breakMinutes', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Long Break Minutes</Label>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    value={session.settings.longBreakMinutes}
                    onChange={(e) => updateSettings(student.id, 'longBreakMinutes', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sound Effect</Label>
                  <Select
                    value={session.settings.soundEffect}
                    onValueChange={(value) => updateSettings(student.id, 'soundEffect', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beep">Beep (Subtle)</SelectItem>
                      <SelectItem value="chime">Chime</SelectItem>
                      <SelectItem value="bell">Bell</SelectItem>
                      <SelectItem value="gong">Gong (Loud)</SelectItem>
                      <SelectItem value="airhorn">Air Horn (Very Loud)</SelectItem>
                      <SelectItem value="duck">Duck Quack (Funny)</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Foreground Color</Label>
                  <Input
                    type="color"
                    value={session.settings.timerForegroundColor || '#3b82f6'}
                    onChange={(e) => updateSettings(student.id, 'timerForegroundColor', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={session.settings.timerBackgroundColor || '#94a3b8'}
                    onChange={(e) => updateSettings(student.id, 'timerBackgroundColor', e.target.value)}
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground pt-2 border-t">
                Sessions completed: {session.sessions_completed} | 
                Next long break in: {session.settings.sessionsUntilLongBreak - (session.sessions_completed % session.settings.sessionsUntilLongBreak)} sessions
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
