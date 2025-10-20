import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Target, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface DiagnosticAssessmentLauncherProps {
  studentId: string;
  buttonText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function DiagnosticAssessmentLauncher({ 
  studentId, 
  buttonText = "Take Diagnostic Assessment",
  variant = "default"
}: DiagnosticAssessmentLauncherProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [framework, setFramework] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const navigate = useNavigate();

  // Check for existing assessments
  const { data: existingAssessments } = useQuery({
    queryKey: ['diagnostic-assessments', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagnostic_assessments')
        .select('*')
        .eq('student_id', studentId)
        .in('status', ['warmup', 'deep_dive'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleStartAssessment = async () => {
    if (!subject) {
      toast({
        title: "Subject Required",
        description: "Please select a subject to assess",
        variant: "destructive"
      });
      return;
    }

    setIsStarting(true);

    try {
      const { data, error } = await supabase.functions.invoke('start-diagnostic-assessment', {
        body: {
          studentId,
          subject,
          framework: framework || null,
          gradeLevel: gradeLevel || null
        }
      });

      if (error) throw error;

      toast({
        title: data.resuming ? "Resuming Assessment" : "Assessment Started",
        description: "Let's discover what you know!"
      });

      // Navigate to the assessment interface
      navigate(`/student/diagnostic/${data.assessmentId}`);
    } catch (error) {
      console.error('Error starting assessment:', error);
      toast({
        title: "Error",
        description: "Could not start assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2"
        size="lg"
        variant={variant}
      >
        <Brain className="h-5 w-5" />
        {buttonText}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Skills Check-In
            </DialogTitle>
            <DialogDescription>
              This quick check-in will help us understand what you know and create a personalized learning path just for you.
              It's completely stress-free - there are no grades!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {existingAssessments && existingAssessments.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  You have an assessment in progress. Starting a new one will resume it.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="English Language Arts">English Language Arts</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Social Studies">Social Studies</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level (Optional)</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger id="gradeLevel">
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 13 }, (_, i) => i).map(grade => (
                    <SelectItem key={grade} value={`Grade ${grade}`}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="framework">Framework (Optional)</Label>
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Common Core">Common Core</SelectItem>
                  <SelectItem value="State Standards">State Standards</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleStartAssessment}
              disabled={isStarting || !subject}
              className="w-full"
              size="lg"
            >
              {isStarting ? "Starting..." : "Begin Assessment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}