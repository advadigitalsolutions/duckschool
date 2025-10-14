import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight } from "lucide-react";

interface StandardsWizardFormProps {
  studentId?: string;
  studentData?: {
    grade_level?: string;
    name?: string;
  };
  onComplete: (data: any) => void;
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const GRADE_LEVELS = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const CORE_SUBJECTS = [
  { id: "math", label: "Mathematics" },
  { id: "ela", label: "English Language Arts" },
  { id: "science", label: "Science" },
  { id: "social-studies", label: "Social Studies/History" },
];

const ADDITIONAL_SUBJECTS = [
  { id: "pe", label: "Physical Education" },
  { id: "art", label: "Art" },
  { id: "music", label: "Music" },
  { id: "foreign-language", label: "Foreign Language" },
  { id: "health", label: "Health" },
  { id: "technology", label: "Technology/Computer Science" },
];

export const StandardsWizardForm = ({ studentData, onComplete }: StandardsWizardFormProps) => {
  const [state, setState] = useState("");
  const [grade, setGrade] = useState(studentData?.grade_level || "");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["math", "ela", "science", "social-studies"]);

  useEffect(() => {
    if (studentData?.grade_level) {
      setGrade(studentData.grade_level);
    }
  }, [studentData]);

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(s => s !== subjectId)
        : [...prev, subjectId]
    );
  };

  const isValid = state && grade && selectedSubjects.length > 0;

  const handleSubmit = () => {
    if (!isValid) return;

    onComplete({
      state,
      grade,
      subjects: selectedSubjects,
      studentName: studentData?.name,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Quick Setup</h3>
        <p className="text-sm text-muted-foreground">
          Provide the essential information to generate a comprehensive standards framework
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger id="state">
              <SelectValue placeholder="Select your state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade">Grade Level *</Label>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger id="grade">
              <SelectValue placeholder="Select grade level" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map(g => (
                <SelectItem key={g} value={g}>{g === "K" ? "Kindergarten" : `Grade ${g}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Core Subjects *</Label>
          <div className="space-y-2">
            {CORE_SUBJECTS.map(subject => (
              <div key={subject.id} className="flex items-center space-x-2">
                <Checkbox
                  id={subject.id}
                  checked={selectedSubjects.includes(subject.id)}
                  onCheckedChange={() => toggleSubject(subject.id)}
                />
                <label
                  htmlFor={subject.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {subject.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Additional Subjects (Optional)</Label>
          <div className="space-y-2">
            {ADDITIONAL_SUBJECTS.map(subject => (
              <div key={subject.id} className="flex items-center space-x-2">
                <Checkbox
                  id={subject.id}
                  checked={selectedSubjects.includes(subject.id)}
                  onCheckedChange={() => toggleSubject(subject.id)}
                />
                <label
                  htmlFor={subject.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {subject.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isValid}
        className="w-full gap-2"
        size="lg"
      >
        Generate Framework
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
