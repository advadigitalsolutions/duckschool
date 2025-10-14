import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Search, FileCheck, Save, MessageSquare, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StandardsPlanningChat } from "./StandardsPlanningChat";
import { StandardsReviewPanel } from "./StandardsReviewPanel";
import { LegalRequirementsPanel } from "./LegalRequirementsPanel";
import { ResearchLoadingState } from "./ResearchLoadingState";
import { StandardsWizardForm } from "./StandardsWizardForm";

interface StandardsPlanningDialogProps {
  studentId?: string;
  onFrameworkCreated?: () => void;
}

export const StandardsPlanningDialog = ({ studentId, onFrameworkCreated }: StandardsPlanningDialogProps) => {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<'gathering' | 'researching' | 'reviewing' | 'finalizing'>('gathering');
  const [mode, setMode] = useState<'wizard' | 'chat'>('wizard');
  const [requirements, setRequirements] = useState<any>({});
  const [researchResults, setResearchResults] = useState<any>(null);
  const [compiledStandards, setCompiledStandards] = useState<any[]>([]);
  const [legalRequirements, setLegalRequirements] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (studentId && open) {
      loadStudentData();
      checkExistingSession();
    }
  }, [studentId, open]);

  const loadStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('grade_level, name')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      setStudentData(data);
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

  const checkExistingSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Look for existing incomplete session
      const { data: existingSession } = await supabase
        .from('standards_planning_sessions')
        .select('*')
        .eq('parent_id', user.id)
        .eq('student_id', studentId)
        .in('status', ['gathering_requirements', 'researching'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSession) {
        setSessionId(existingSession.id);
        setRequirements(existingSession.requirements || {});
        const standards = existingSession.compiled_standards;
        setCompiledStandards(Array.isArray(standards) ? standards : []);
        setLegalRequirements(existingSession.legal_requirements || {});
        setResearchResults(existingSession.research_results || null);

        // Restore phase based on session state
        const compiledStds = Array.isArray(standards) ? standards : [];
        if (compiledStds.length > 0) {
          setPhase('reviewing');
        } else if (existingSession.research_results) {
          setPhase('researching');
        } else {
          setPhase('gathering');
        }

        toast({
          title: "Session Restored",
          description: "Continuing from where you left off.",
        });
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    }
  };

  const startSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('standards_planning_sessions')
        .insert({
          parent_id: user.id,
          student_id: studentId,
          status: 'gathering_requirements'
        })
        .select()
        .single();

      if (error) throw error;
      setSessionId(data.id);
      setPhase('gathering');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRequirementsComplete = async (reqs: any) => {
    setRequirements(reqs);
    setPhase('researching');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('research-standards', {
        body: { sessionId, requirements: reqs }
      });

      if (error) throw error;

      setResearchResults(data.researchResults);
      setCompiledStandards(data.compiledStandards);
      setLegalRequirements(data.legalRequirements);
      setPhase('reviewing');

      toast({
        title: "Research Complete",
        description: `Found ${data.compiledStandards.length} standards and compiled legal requirements.`
      });
    } catch (error: any) {
      toast({
        title: "Research Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (notes: string) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create custom framework
      const frameworkName = `${requirements.state} Grade ${requirements.grade} Standards`;
      
      const { data, error } = await supabase
        .from('custom_frameworks')
        .insert({
          created_by: user.id,
          name: frameworkName,
          description: notes,
          region: requirements.state,
          grade_levels: [requirements.grade],
          subjects: requirements.subjects || [],
          standards: compiledStandards,
          legal_requirements: legalRequirements,
          is_approved: true,
          approved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update session status
      await supabase
        .from('standards_planning_sessions')
        .update({
          status: 'completed',
          parent_notes: notes
        })
        .eq('id', sessionId);

      toast({
        title: "Framework Created",
        description: `"${frameworkName}" is now available for curriculum planning.`
      });

      setOpen(false);
      onFrameworkCreated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen && !sessionId) startSession();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Create Standards Framework
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Standards Framework Planning</DialogTitle>
          <DialogDescription>
            AI-assisted standards research and legal compliance setup for homeschool curriculum
          </DialogDescription>
        </DialogHeader>

        <Tabs value={phase} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger 
              value="gathering" 
              disabled={phase !== 'gathering'}
              onClick={() => phase === 'gathering' && setPhase('gathering')}
            >
              <Search className="h-4 w-4 mr-2" />
              Gather Info
            </TabsTrigger>
            <TabsTrigger value="researching" disabled={phase !== 'researching' && phase !== 'reviewing'}>
              <BookOpen className="h-4 w-4 mr-2" />
              Research
            </TabsTrigger>
            <TabsTrigger value="reviewing" disabled={phase !== 'reviewing' && phase !== 'finalizing'}>
              <FileCheck className="h-4 w-4 mr-2" />
              Review
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="gathering" className="space-y-4">
              <div className="flex gap-2 mb-4 justify-center">
                <Button
                  variant={mode === 'wizard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('wizard')}
                  className="gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Quick Setup
                </Button>
                <Button
                  variant={mode === 'chat' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('chat')}
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Guided Chat
                </Button>
              </div>

              {mode === 'wizard' ? (
                <StandardsWizardForm
                  studentId={studentId}
                  studentData={studentData}
                  onComplete={handleRequirementsComplete}
                />
              ) : (
                sessionId && (
                  <StandardsPlanningChat
                    sessionId={sessionId}
                    phase="gathering_requirements"
                    onComplete={handleRequirementsComplete}
                  />
                )
              )}
            </TabsContent>

            <TabsContent value="researching" className="space-y-4">
              <ResearchLoadingState 
                state={requirements.state} 
                grade={requirements.grade} 
              />
            </TabsContent>

            <TabsContent value="reviewing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StandardsReviewPanel
                  standards={compiledStandards}
                  onUpdate={setCompiledStandards}
                />
                <LegalRequirementsPanel
                  requirements={legalRequirements}
                  sources={researchResults?.sources}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    const notes = prompt("Add any notes about this framework:");
                    if (notes !== null) handleApprove(notes);
                  }}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Approve & Create Framework
                </Button>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};