import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, Star, Flame, Medal, Crown } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  avatarUrl?: string;
  value: number;
  rank: number;
}

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');

  // Determine if user is parent or student
  const { data: userRole } = useQuery({
    queryKey: ['user-role-leaderboard'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check if student
      const { data: student } = await supabase
        .from('students')
        .select('id, parent_id')
        .eq('user_id', user.id)
        .single();

      if (student) {
        return { role: 'student', parentId: student.parent_id, studentId: student.id };
      }

      // Assume parent
      return { role: 'parent', parentId: user.id, studentId: null };
    }
  });

  // Fetch students for the parent
  const { data: students = [] } = useQuery({
    queryKey: ['leaderboard-students', userRole?.parentId],
    queryFn: async () => {
      if (!userRole?.parentId) return [];
      
      const { data } = await supabase
        .from('students')
        .select('id, name, display_name, avatar_url')
        .eq('parent_id', userRole.parentId);

      return data || [];
    },
    enabled: !!userRole?.parentId
  });

  // Fetch active minutes leaderboard
  const { data: activeMinutesData = [] } = useQuery({
    queryKey: ['leaderboard-active-minutes', userRole?.parentId, timeframe],
    queryFn: async () => {
      if (!userRole?.parentId) return [];

      const studentIds = students.map(s => s.id);
      if (studentIds.length === 0) return [];

      let dateFilter = format(new Date(), 'yyyy-MM-dd');
      if (timeframe === 'week') {
        dateFilter = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      } else if (timeframe === 'month') {
        dateFilter = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      }

      const { data } = await supabase
        .from('daily_activity_minutes')
        .select('student_id, active_seconds, date')
        .in('student_id', studentIds)
        .gte('date', dateFilter);

      // Aggregate by student
      const aggregated: Record<string, number> = {};
      (data || []).forEach(row => {
        if (!aggregated[row.student_id]) {
          aggregated[row.student_id] = 0;
        }
        aggregated[row.student_id] += row.active_seconds;
      });

      // Map to leaderboard entries
      const entries: LeaderboardEntry[] = Object.entries(aggregated)
        .map(([studentId, seconds]) => {
          const student = students.find(s => s.id === studentId);
          return {
            studentId,
            studentName: student?.display_name || student?.name || 'Unknown',
            avatarUrl: student?.avatar_url,
            value: Math.round(seconds / 60), // Convert to minutes
            rank: 0
          };
        })
        .sort((a, b) => b.value - a.value)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      return entries;
    },
    enabled: !!userRole?.parentId && students.length > 0
  });

  // Fetch lessons completed with 75%+ comprehension
  const { data: lessonsData = [] } = useQuery({
    queryKey: ['leaderboard-lessons', userRole?.parentId],
    queryFn: async () => {
      if (!userRole?.parentId) return [];

      const studentIds = students.map(s => s.id);
      if (studentIds.length === 0) return [];

      // Get grades with 75%+ score
      const { data } = await supabase
        .from('grades')
        .select('student_id, score, max_score')
        .in('student_id', studentIds)
        .not('score', 'is', null)
        .not('max_score', 'is', null);

      // Count lessons with 75%+ for each student
      const counts: Record<string, number> = {};
      (data || []).forEach(row => {
        if (row.score && row.max_score && (row.score / row.max_score) >= 0.75) {
          if (!counts[row.student_id!]) {
            counts[row.student_id!] = 0;
          }
          counts[row.student_id!]++;
        }
      });

      // Map to leaderboard entries
      const entries: LeaderboardEntry[] = Object.entries(counts)
        .map(([studentId, count]) => {
          const student = students.find(s => s.id === studentId);
          return {
            studentId,
            studentName: student?.display_name || student?.name || 'Unknown',
            avatarUrl: student?.avatar_url,
            value: count,
            rank: 0
          };
        })
        .sort((a, b) => b.value - a.value)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      // Include students with 0 lessons
      students.forEach(student => {
        if (!entries.find(e => e.studentId === student.id)) {
          entries.push({
            studentId: student.id,
            studentName: student.display_name || student.name,
            avatarUrl: student.avatar_url,
            value: 0,
            rank: entries.length + 1
          });
        }
      });

      return entries;
    },
    enabled: !!userRole?.parentId && students.length > 0
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-300" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500/20 via-yellow-400/10 to-transparent border-yellow-400/50';
      case 2:
        return 'from-gray-300/20 via-gray-200/10 to-transparent border-gray-300/50';
      case 3:
        return 'from-amber-600/20 via-amber-500/10 to-transparent border-amber-500/50';
      default:
        return 'from-muted/50 to-transparent border-border';
    }
  };

  const LeaderboardCard = ({ entries, title, description, unit }: { 
    entries: LeaderboardEntry[], 
    title: string, 
    description: string,
    unit: string 
  }) => (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No data yet. Start learning to see the leaderboard!</p>
              </div>
            ) : (
              entries.map((entry, index) => (
                <motion.div
                  key={entry.studentId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${getRankGradient(entry.rank)} border-2 transition-all hover:scale-[1.02]`}
                >
                  <div className="flex-shrink-0 w-10 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <div className="flex-shrink-0">
                    {entry.avatarUrl ? (
                      <img 
                        src={entry.avatarUrl} 
                        alt={entry.studentName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {entry.studentName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{entry.studentName}</p>
                    {entry.rank === 1 && (
                      <p className="text-xs text-yellow-500 flex items-center gap-1">
                        <Flame className="h-3 w-3" /> Leader!
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-2xl font-bold text-primary">{entry.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{unit}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-yellow-400" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">
          Compete with your fellow students! See who's putting in the most focused time and mastering the most lessons.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Time Leaderboard */}
        <div>
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)} className="mb-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Today
              </TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <LeaderboardCard 
            entries={activeMinutesData}
            title="Active Time"
            description="Minutes spent actively learning (mouse activity detected)"
            unit="minutes"
          />
        </div>

        {/* Lessons Mastered Leaderboard */}
        <LeaderboardCard 
          entries={lessonsData}
          title="Lessons Mastered"
          description="Assignments completed with 75%+ comprehension"
          unit="lessons"
        />
      </div>

      {/* Fun stats section */}
      {(activeMinutesData.length > 0 || lessonsData.length > 0) && (
        <Card className="mt-6 bg-gradient-to-r from-primary/5 via-chart-1/5 to-chart-2/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-chart-1" />
              Fun Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className="text-3xl font-bold text-primary">
                  {activeMinutesData.reduce((sum, e) => sum + e.value, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total minutes today</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className="text-3xl font-bold text-chart-1">
                  {lessonsData.reduce((sum, e) => sum + e.value, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total lessons mastered</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className="text-3xl font-bold text-chart-2">
                  {students.length}
                </p>
                <p className="text-sm text-muted-foreground">Competitors</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-background/50">
                <p className="text-3xl font-bold text-chart-3">
                  {activeMinutesData.length > 0 
                    ? Math.round(activeMinutesData.reduce((sum, e) => sum + e.value, 0) / activeMinutesData.length)
                    : 0}
                </p>
                <p className="text-sm text-muted-foreground">Avg minutes/student</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
