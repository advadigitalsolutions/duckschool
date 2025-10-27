import { useKnowledgeProfile } from "@/hooks/useKnowledgeProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, BookOpen, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentKnowledgeProfilePanelProps {
  studentId: string;
  subject?: string;
}

export function StudentKnowledgeProfilePanel({ studentId, subject }: StudentKnowledgeProfilePanelProps) {
  const { data: profile, isLoading } = useKnowledgeProfile(studentId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  // Filter by subject if provided
  const filteredMastery = subject 
    ? profile.mastery?.filter((m: any) => m.subject === subject)
    : profile.mastery;

  const diagnosticData = filteredMastery?.filter((m: any) => m.dataSource === 'diagnostic') || [];
  const assignmentData = filteredMastery?.filter((m: any) => m.dataSource === 'assignment') || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Knowledge Profile{subject && `: ${subject}`}
        </CardTitle>
        <CardDescription>
          {profile.diagnosticCount} diagnostic assessment{profile.diagnosticCount !== 1 ? 's' : ''}, 
          {' '}{profile.assignmentBasedCount} assignment{profile.assignmentBasedCount !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Diagnostic-Based Mastery */}
        {diagnosticData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold text-sm">Diagnostic Assessment Data</h4>
              <Badge variant="outline" className="text-xs">{diagnosticData.length} standards</Badge>
            </div>
            <div className="space-y-2">
              {diagnosticData.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.standard_code}</span>
                    <div className="flex items-center gap-2">
                      {item.isRecent && (
                        <Badge variant="secondary" className="text-xs">Recent</Badge>
                      )}
                      <span className="text-muted-foreground">{Math.round(item.mastery_level)}%</span>
                    </div>
                  </div>
                  <Progress value={item.mastery_level} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    Confidence: {Math.round(item.confidence_score || 0)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignment-Based Mastery */}
        {assignmentData.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold text-sm">Assignment Performance Data</h4>
              <Badge variant="outline" className="text-xs">{assignmentData.length} standards</Badge>
            </div>
            <div className="space-y-2">
              {assignmentData.slice(0, 5).map((item: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.standard_code}</span>
                    <div className="flex items-center gap-2">
                      {item.isRecent && (
                        <Badge variant="secondary" className="text-xs">Recent</Badge>
                      )}
                      <span className="text-muted-foreground">{Math.round(item.mastery_level)}%</span>
                    </div>
                  </div>
                  <Progress value={item.mastery_level} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {item.total_attempts} attempt{item.total_attempts !== 1 ? 's' : ''}, 
                    {' '}{item.successful_attempts} successful
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weak Areas */}
        {profile.weakAreas && profile.weakAreas.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <h4 className="font-semibold text-sm">Priority Learning Areas</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.weakAreas.slice(0, 10).map((area: any, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {area.standard_code} ({Math.round(area.mastery_level)}%)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {diagnosticData.length === 0 && assignmentData.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No mastery data available yet. Complete diagnostic assessments or assignments to see progress.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
