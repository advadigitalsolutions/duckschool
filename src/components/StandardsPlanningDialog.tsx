import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAvailableFrameworks } from "@/hooks/useAvailableFrameworks";

interface StandardsPlanningDialogProps {
  studentId?: string;
  onFrameworkCreated?: () => void;
}

export const StandardsPlanningDialog = ({ studentId, onFrameworkCreated }: StandardsPlanningDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [standards, setStandards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { frameworks, loading: frameworksLoading } = useAvailableFrameworks();
  const { toast } = useToast();

  // Load available subjects when framework is selected
  useEffect(() => {
    console.log('Framework changed to:', selectedFramework);
    if (selectedFramework && selectedFramework !== 'CUSTOM') {
      loadSubjects();
    } else {
      console.log('Clearing subjects - framework is:', selectedFramework);
      setAvailableSubjects([]);
      setSelectedSubjects([]);
      setStandards([]);
    }
  }, [selectedFramework]);

  // Load standards when subjects are selected
  useEffect(() => {
    if (selectedFramework && selectedSubjects.length > 0) {
      loadStandards();
    } else {
      setStandards([]);
    }
  }, [selectedFramework, selectedSubjects]);

  const loadSubjects = async () => {
    try {
      console.log('Loading subjects for framework:', selectedFramework);
      const { data, error } = await supabase
        .from('standards')
        .select('subject')
        .eq('framework', selectedFramework)
        .order('subject');

      if (error) throw error;
      console.log('Raw subject data:', data);

      // Get unique subjects
      const uniqueSubjects = [...new Set(data.map(s => s.subject).filter(Boolean))];
      console.log('Unique subjects found:', uniqueSubjects);
      setAvailableSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast({
        title: "Error",
        description: "Failed to load available subjects",
        variant: "destructive"
      });
    }
  };

  const loadStandards = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('standards')
        .select('*')
        .eq('framework', selectedFramework)
        .in('subject', selectedSubjects)
        .order('code');

      if (error) throw error;
      setStandards(data || []);
    } catch (error) {
      console.error('Error loading standards:', error);
      toast({
        title: "Error",
        description: "Failed to load standards",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleCreateCourse = async () => {
    if (!studentId || selectedSubjects.length === 0) return;

    setIsLoading(true);
    try {
      // Create a course for each selected subject
      for (const subject of selectedSubjects) {
        const { error } = await supabase
          .from('courses')
          .insert({
            student_id: studentId,
            title: subject,
            subject: subject,
            standards_scope: [{
              framework: selectedFramework,
              subject: subject
            }]
          });

        if (error) throw error;
      }

      toast({
        title: "Courses Created",
        description: `Created ${selectedSubjects.length} course(s) with ${standards.length} standards`
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Create Course from Standards
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Course from Standards</DialogTitle>
          <DialogDescription>
            Select from available standards frameworks and subjects to create new courses
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px]">
          <div className="space-y-6 p-6">
            {/* Framework Selection */}
            <div className="space-y-2">
              <Label>Standards Framework *</Label>
              <Select 
                value={selectedFramework} 
                onValueChange={setSelectedFramework}
                disabled={frameworksLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={frameworksLoading ? "Loading..." : "Select framework"} />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.filter(f => f.value !== 'CUSTOM').map(fw => (
                    <SelectItem key={fw.value} value={fw.value}>
                      {fw.label} {fw.standardCount > 0 && `(${fw.standardCount} standards)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Selection */}
            {availableSubjects.length > 0 && (
              <div className="space-y-2">
                <Label>Select Subjects *</Label>
                <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-muted/50">
                  {availableSubjects.map(subject => (
                    <Badge
                      key={subject}
                      variant={selectedSubjects.includes(subject) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleSubject(subject)}
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Click subjects to select. A course will be created for each selected subject.
                </p>
              </div>
            )}

            {/* Standards Preview */}
            {standards.length > 0 && (
              <div className="space-y-2">
                <Label>Available Standards ({standards.length})</Label>
                <div className="border rounded-lg p-4 bg-muted/50 max-h-[300px] overflow-y-auto">
                  <div className="space-y-2 text-sm">
                    {standards.slice(0, 10).map(std => (
                      <div key={std.id} className="pb-2 border-b last:border-0">
                        <div className="font-mono text-xs text-primary">{std.code}</div>
                        <div className="text-muted-foreground line-clamp-2">{std.text}</div>
                      </div>
                    ))}
                    {standards.length > 10 && (
                      <div className="text-center text-muted-foreground pt-2">
                        ... and {standards.length - 10} more standards
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateCourse}
            disabled={isLoading || selectedSubjects.length === 0 || !selectedFramework}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Create {selectedSubjects.length > 0 && `${selectedSubjects.length} `}Course{selectedSubjects.length !== 1 && 's'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};