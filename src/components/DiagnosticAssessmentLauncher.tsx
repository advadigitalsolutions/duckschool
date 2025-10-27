import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Target, Sword, Info } from "lucide-react";
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
  const [framework, setFramework] = useState("CA-CCSS");
  const [gradeLevel, setGradeLevel] = useState("unspecified");
  const [customGoals, setCustomGoals] = useState("");
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

  // Reset framework when subject changes
  useEffect(() => {
    if (subject && subject !== "Other") {
      setFramework("CA-CCSS");
      setCustomGoals("");
    } else if (subject === "Other") {
      setFramework("CUSTOM");
    }
  }, [subject]);

  const handleStartAssessment = async () => {
    console.log('🎯 Begin Assessment clicked:', { subject, framework, gradeLevel, customGoals, studentId });
    
    if (!subject) {
      toast({
        title: "Subject Required",
        description: "Please select a subject to assess",
        variant: "destructive"
      });
      return;
    }

    if (subject === "Other" && !customGoals.trim()) {
      toast({
        title: "Goals Required",
        description: "Please describe what you want to be assessed on",
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
          framework: framework || "CA-CCSS",
          gradeLevel: (gradeLevel && gradeLevel !== "unspecified") ? gradeLevel : null,
          customGoals: subject === "Other" ? customGoals : null
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
      setOpen(false);
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

            {subject === "Other" ? (
              <div className="space-y-2">
                <Label htmlFor="customGoals">What would you like to be assessed on? *</Label>
                <Textarea
                  id="customGoals"
                  placeholder="Example: I want to assess my knowledge of cooking techniques, meal planning, and nutrition basics for a home economics course."
                  value={customGoals}
                  onChange={(e) => setCustomGoals(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  Describe the topics and skills you want evaluated. This helps us create relevant questions.
                </p>
              </div>
            ) : subject ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="framework">Standards Framework *</Label>
                  <Select value={framework} onValueChange={setFramework}>
                    <SelectTrigger id="framework">
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA-CCSS">California Common Core (CA-CCSS)</SelectItem>
                      <SelectItem value="CCSS">Common Core State Standards (CCSS)</SelectItem>
                      <SelectItem value="NGSS">Next Generation Science Standards (NGSS)</SelectItem>
                      <SelectItem value="TX-TEKS">Texas Essential Knowledge and Skills (TX-TEKS)</SelectItem>
                      <SelectItem value="FL-BEST">Florida BEST Standards</SelectItem>
                      <SelectItem value="NY-CCLS">New York State Learning Standards</SelectItem>
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
                      <SelectItem value="unspecified">Not specified</SelectItem>
                      {Array.from({ length: 13 }, (_, i) => i).map(grade => (
                        <SelectItem key={grade} value={grade.toString()}>
                          Grade {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    We'll adapt the difficulty based on your responses if not specified
                  </p>
                </div>
              </>
            ) : null}

            <Button
              onClick={handleStartAssessment}
              disabled={isStarting || !subject || (subject === "Other" && !customGoals.trim())}
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