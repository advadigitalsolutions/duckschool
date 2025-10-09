import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CourseConfigurationPromptProps {
  missingData: string[];
  courseId: string;
  gradeLevel?: string;
  subject?: string;
}

export function CourseConfigurationPrompt({ 
  missingData, 
  courseId,
  gradeLevel,
  subject 
}: CourseConfigurationPromptProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-warning">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <CardTitle>Course Configuration Needed</CardTitle>
        </div>
        <CardDescription>
          To provide accurate progress tracking and pacing recommendations, we need some additional information about this course.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Missing Information:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {missingData.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {gradeLevel && subject && (
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">What we know:</p>
            <ul className="text-sm space-y-1">
              <li>• Grade Level: {gradeLevel}</li>
              <li>• Subject: {subject}</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              With regional standards configured, we can automatically determine the framework requirements 
              and provide accurate completion estimates based on {gradeLevel} expectations.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={() => navigate(`/student/${courseId}`)}>
            <Settings className="mr-2 h-4 w-4" />
            Configure Course
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
