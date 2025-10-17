import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XPDisplay } from '@/components/XPDisplay';
import { useXP } from '@/hooks/useXP';
import { BarChart3, TrendingUp, Award, TrendingDown } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function StudentXP() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState<string | null>(null);
  const { totalXP, availableXP, weeklyXP, xpEvents, loading } = useXP(studentId || undefined);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchStudentId();
  }, []);

  useEffect(() => {
    if (xpEvents.length > 0) {
      calculateTrends();
    }
  }, [xpEvents]);

  const fetchStudentId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentData) {
        setStudentId(studentData.id);
      }
    } catch (error) {
      console.error('Error fetching student ID:', error);
    }
  };

  const calculateTrends = () => {
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i);
      return {
        date: format(date, 'EEE'),
        xp: 0,
      };
    });

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(now, 29 - i);
      return {
        date: format(date, 'MMM d'),
        xp: 0,
      };
    });

    // Aggregate XP by day
    xpEvents.forEach((event) => {
      const eventDate = new Date(event.created_at);
      const daysDiff = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff < 7) {
        last7Days[6 - daysDiff].xp += event.amount;
      }
      if (daysDiff < 30) {
        last30Days[29 - daysDiff].xp += event.amount;
      }
    });

    setWeeklyData(last7Days);
    setMonthlyData(last30Days);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">My XP</h1>
        <p className="text-muted-foreground">Track your experience points and progress</p>
      </div>

      {/* XP Display */}
      <XPDisplay studentId={studentId || undefined} variant="full" />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalXP}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available XP</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableXP}</div>
            <p className="text-xs text-muted-foreground">Ready to spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyXP}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* XP Event History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent XP Events</CardTitle>
          <CardDescription>Your latest XP gains and losses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {xpEvents.slice(0, 20).map((event) => {
              const isLoss = event.amount < 0;
              const isClickable = event.reference_id && event.event_type === 'overdue_penalty';
              
              return (
                <div 
                  key={event.id} 
                  className={`flex items-center justify-between border-b pb-3 ${
                    isClickable ? 'cursor-pointer hover:bg-accent/50 rounded-md p-2 transition-colors' : ''
                  }`}
                  onClick={() => isClickable && navigate(`/assignment/${event.reference_id}`)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isLoss ? (
                      <TrendingDown className="h-5 w-5 text-destructive flex-shrink-0" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${isLoss ? 'text-destructive' : ''}`}>
                        {event.description}
                        {isClickable && ' →'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${isLoss ? 'text-destructive' : 'text-primary'} whitespace-nowrap ml-4`}>
                    {isLoss ? '' : '+'}{event.amount} XP
                  </div>
                </div>
              );
            })}
            {xpEvents.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No XP events yet. Complete assignments to start earning!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
