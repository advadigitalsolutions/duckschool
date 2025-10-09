import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface TimeBySubject {
  subject: string;
  minutes: number;
}

interface StandardsCoverage {
  covered: number;
  total: number;
  percentage: number;
}

interface CourseProgressChartsProps {
  timeBySubject: TimeBySubject[];
  standardsCoverage: StandardsCoverage | null;
}

export function CourseProgressCharts({ timeBySubject, standardsCoverage }: CourseProgressChartsProps) {
  const timeData = timeBySubject.map((item) => ({
    name: item.subject,
    value: Math.round(item.minutes),
    fill: 'hsl(var(--primary))'
  }));

  const standardsData = standardsCoverage ? [
    {
      name: 'Covered',
      value: standardsCoverage.covered,
      fill: 'hsl(var(--primary))'
    },
    {
      name: 'Remaining',
      value: standardsCoverage.total - standardsCoverage.covered,
      fill: 'hsl(var(--muted))'
    }
  ] : [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Time by Subject */}
      <Card>
        <CardHeader>
          <CardTitle>Time Investment</CardTitle>
          <CardDescription>Minutes spent on coursework</CardDescription>
        </CardHeader>
        <CardContent>
          {timeData.length > 0 ? (
            <ChartContainer
              config={{
                time: {
                  label: "Minutes",
                  color: "hsl(var(--primary))"
                }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}m`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {timeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No time data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Standards Coverage */}
      <Card>
        <CardHeader>
          <CardTitle>Standards Coverage</CardTitle>
          <CardDescription>
            {standardsCoverage ? `${standardsCoverage.percentage.toFixed(0)}% complete` : 'No data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {standardsData.length > 0 ? (
            <ChartContainer
              config={{
                covered: {
                  label: "Covered",
                  color: "hsl(var(--primary))"
                },
                remaining: {
                  label: "Remaining",
                  color: "hsl(var(--muted))"
                }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={standardsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {standardsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No standards data yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
