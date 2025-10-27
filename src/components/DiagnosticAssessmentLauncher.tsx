import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Target, Sword } from "lucide-react";
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

  // Auto-detect framework and grade level from student's courses when subject changes
  const { data: studentCourses } = useQuery({
    queryKey: ['student-courses-for-diagnostic', studentId, subject],
    queryFn: async () => {
      if (!subject) return null;
      
      const { data, error } = await supabase
        .from('courses')
        .select('subject, grade_level, standards_scope')
        .eq('student_id', studentId)
        .eq('subject', subject)
        .eq('archived', false)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!subject
  });

  // Auto-populate framework and grade from detected course
  useEffect(() => {
    if (studentCourses) {
      const detectedFramework = studentCourses.standards_scope?.[0]?.framework;
      const detectedGrade = studentCourses.grade_level;
      
      if (detectedFramework && detectedFramework !== framework) {
        setFramework(detectedFramework);
      }
      if (detectedGrade && detectedGrade !== gradeLevel) {
        setGradeLevel(detectedGrade);
      }
    }
  }, [studentCourses]);

  const handleStartAssessment = async () => {
    console.log('🎯 Begin Assessment clicked:', { subject, framework, gradeLevel, studentId });
    
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
      console.log('🔄 Invoking start-diagnostic-assessment function...');
      const { data, error } = await supabase.functions.invoke('start-diagnostic-assessment', {
        body: {
          studentId,
          subject,
          framework: framework || null,
          gradeLevel: gradeLevel || null
        }
      });

      console.log('📥 Function response:', { data, error });

      if (error) {
        console.error('❌ Function returned error:', {
          message: error.message,
          name: error.name,
          context: error.context,
          details: error
        });
        throw new Error(error.message || 'Failed to start assessment');
      }

      if (!data || !data.assessmentId) {
        console.error('❌ Invalid response data:', data);
        throw new Error('Invalid response from server - no assessment ID');
      }

      toast({
        title: data.resuming ? "Resuming Assessment" : "Assessment Started",
        description: "Let's discover what you know!"
      });

      console.log('✅ Navigating to assessment:', data.assessmentId);
      // Navigate to the assessment interface
      navigate(`/student/diagnostic/${data.assessmentId}`);
    } catch (error: any) {
      console.error('💥 Full error object:', error);
      console.error('💥 Error details:', {
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause
      });
      
      const errorMessage = error?.message || error?.toString() || "Could not start assessment. Please try again.";
      
      toast({
        title: "Error Starting Assessment",
        description: errorMessage,
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
        <Sword className="h-5 w-5" />
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
                  <SelectItem value="Home Economics">Home Economics</SelectItem>
                  <SelectItem value="Life Skills">Life Skills</SelectItem>
                  <SelectItem value="Physical Education">Physical Education</SelectItem>
                  <SelectItem value="Arts & Music">Arts & Music</SelectItem>
                  <SelectItem value="Foreign Language">Foreign Language</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {studentCourses && (framework || gradeLevel) && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-900 dark:text-green-100 font-medium mb-1">
                  Auto-detected from your {subject} course:
                </p>
                <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                  {framework && <li>• Framework: {framework}</li>}
                  {gradeLevel && <li>• Grade Level: {gradeLevel}</li>}
                </ul>
              </div>
            )}

            {subject && !studentCourses && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  No {subject} course found. You can manually select grade level below if needed.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level {gradeLevel ? '(Auto-detected)' : '(Optional)'}</Label>
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