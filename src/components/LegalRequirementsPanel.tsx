import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";

interface LegalRequirementsPanelProps {
  requirements: any;
  sources?: Array<{ url: string; description: string; type: string }>;
}

export const LegalRequirementsPanel = ({ requirements, sources }: LegalRequirementsPanelProps) => {
  if (!requirements) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Requirements</CardTitle>
          <CardDescription>Loading compliance information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Requirements & Compliance</CardTitle>
        <CardDescription>State homeschool regulations and documentation needs</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {requirements.requiredSubjects && (
              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Required Subjects
                </h4>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {requirements.requiredSubjects.description || 
                   "Generally, subjects taught in public schools, though the specific list for homeschoolers is not set by statute. California Education Code section 48222 outlines that children 6-18 are exempt from public school attendance if they are being taught by a tutor with a valid state teaching credential or attending a private full-time day school. Homeschoolers typically operate as private schools."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(requirements.requiredSubjects) 
                    ? requirements.requiredSubjects 
                    : ['English', 'Mathematics', 'Social Sciences', 'Science', 'Visual and Performing Arts', 'Health', 'Physical Education']
                  ).map((subject: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="bg-background">{subject}</Badge>
                  ))}
                </div>
              </div>
            )}

            {requirements.instructionalHours && (
              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <h4 className="font-semibold mb-2">Instructional Hours/Days</h4>
                <p className="text-sm text-foreground/80 leading-relaxed">{requirements.instructionalHours}</p>
              </div>
            )}

            {requirements.assessmentRequirements && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Assessment Requirements:</strong><br />
                  {requirements.assessmentRequirements}
                </AlertDescription>
              </Alert>
            )}

            {requirements.recordKeeping && (
              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <h4 className="font-semibold mb-2">Record Keeping</h4>
                <p className="text-sm text-foreground/80 leading-relaxed">{requirements.recordKeeping}</p>
              </div>
            )}

            {requirements.notification && (
              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <h4 className="font-semibold mb-2">Notification/Registration</h4>
                <p className="text-sm text-foreground/80 leading-relaxed">{requirements.notification}</p>
              </div>
            )}

            {requirements.documentation && requirements.documentation.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recommended Documentation</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {requirements.documentation.map((item: string, idx: number) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {sources && sources.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Official Sources</h4>
                <div className="space-y-2">
                  {sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {source.description}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};