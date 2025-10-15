import { useState } from 'react';
import { SessionStatsCard } from './SessionStatsCard';
import { SessionHistoryTable } from './SessionHistoryTable';
import { ActivityTimelineChart } from './ActivityTimelineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, startOfWeek, startOfMonth } from 'date-fns';

interface FocusAnalyticsDashboardProps {
  studentId: string;
}

export function FocusAnalyticsDashboard({ studentId }: FocusAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        return { start: startOfDay, end: now };
      case 'week':
        return { start: startOfWeek(now), end: now };
      case 'month':
        return { start: startOfMonth(now), end: now };
      case 'all':
        return undefined;
      default:
        return { start: startOfWeek(now), end: now };
    }
  };

  const getDaysForChart = () => {
    switch (dateRange) {
      case 'today':
        return 1;
      case 'week':
        return 7;
      case 'month':
        return 30;
      default:
        return 7;
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Focus Time Analytics</CardTitle>
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Card */}
      <SessionStatsCard studentId={studentId} dateRange={getDateRange()} />

      {/* Activity Chart */}
      {dateRange !== 'today' && (
        <ActivityTimelineChart studentId={studentId} days={getDaysForChart()} />
      )}

      {/* Session History */}
      <SessionHistoryTable studentId={studentId} dateRange={getDateRange()} />
    </div>
  );
}
