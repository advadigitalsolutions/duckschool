import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { ExternalLink, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface StudentResearchReviewProps {
  studentId: string;
}

export const StudentResearchReview: React.FC<StudentResearchReviewProps> = ({ studentId }) => {
  const [researchData, setResearchData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResearchData();
  }, [studentId]);

  const fetchResearchData = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_research')
        .select(`
          *,
          assignments:assignment_id (
            id,
            curriculum_items (
              title,
              courses (
                title,
                subject
              )
            )
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResearchData(data || []);
    } catch (error) {
      console.error('Error fetching research data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getResourceTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      video: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      article: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      interactive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };

    return (
      <Badge variant="outline" className={colors[type] || colors.other}>
        {type}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (researchData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No research resources found yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Student research will appear here as they complete research-based assignments
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by assignment
  const groupedByAssignment = researchData.reduce((acc, item) => {
    const assignmentId = item.assignment_id;
    if (!acc[assignmentId]) {
      acc[assignmentId] = {
        assignment: item.assignments,
        resources: []
      };
    }
    acc[assignmentId].resources.push(item);
    return acc;
  }, {} as Record<string, { assignment: any; resources: any[] }>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByAssignment).map(([assignmentId, groupData]: [string, { assignment: any; resources: any[] }]) => (
        <Card key={assignmentId}>
          <CardHeader>
            <CardTitle className="text-lg">
              {groupData.assignment?.curriculum_items?.title || 'Unknown Assignment'}
            </CardTitle>
            <CardDescription>
              {groupData.assignment?.curriculum_items?.courses?.subject} • {groupData.resources.length} resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {groupData.resources.map((resource: any, idx: number) => (
                  <div key={resource.id}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getStatusIcon(resource.validation_status)}</div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <a
                              href={resource.resource_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline flex items-center gap-2"
                            >
                              {resource.resource_title || 'Untitled Resource'}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <p className="text-sm text-muted-foreground break-all">
                              {resource.resource_url}
                            </p>
                          </div>
                          {resource.resource_type && getResourceTypeBadge(resource.resource_type)}
                        </div>

                        {resource.notes && (
                          <div className="bg-muted/50 rounded-md p-3">
                            <p className="text-sm font-medium mb-1">Student Notes:</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {resource.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Added {new Date(resource.created_at).toLocaleDateString()}</span>
                          {resource.validated_at && (
                            <span>Validated {new Date(resource.validated_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {idx < groupData.resources.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};