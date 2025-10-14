import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, FileText, Image as ImageIcon, FileCheck, Lightbulb, Brain, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TipTapImage from '@tiptap/extension-image';

interface ProjectModule {
  id: string;
  title: string;
  description: string;
  guidance: string;
  prompts: string[];
  required_artifacts: string[];
  optional_artifacts: string[];
  coaching_focus: string;
}

interface ProjectModuleSubmissionProps {
  assignment: any;
  studentId: string;
}

interface Artifact {
  type: 'text' | 'image' | 'document';
  title: string;
  content?: string;
  url?: string;
  caption?: string;
  file?: File;
}

export function ProjectModuleSubmission({ assignment, studentId }: ProjectModuleSubmissionProps) {
  const content = assignment?.curriculum_items?.body || {};
  const modules: ProjectModule[] = content.modules || [];
  const currentModuleIndex = 0; // TODO: Track which module student is on
  const currentModule = modules[currentModuleIndex];

  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [questions, setQuestions] = useState('');
  const [confidence, setConfidence] = useState([5]);
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWasChallenging, setWhatWasChallenging] = useState('');
  const [readyForNext, setReadyForNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [draftSubmissionId, setDraftSubmissionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [reviewingWithAI, setReviewingWithAI] = useState(false);

  // Rich text editor for each prompt
  const createEditor = (promptIndex: number) => {
    return useEditor({
      extensions: [
        StarterKit,
        Underline,
        Highlight,
        TipTapImage,
      ],
      content: reflections[`prompt_${promptIndex + 1}`] || '',
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        setReflections(prev => ({
          ...prev,
          [`prompt_${promptIndex + 1}`]: html
        }));
      },
    });
  };

  // Time tracking
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-save to localStorage every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraftToLocalStorage();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [reflections, artifacts, questions, confidence, whatWentWell, whatWasChallenging, readyForNext]);

  // Load draft from localStorage on mount
  useEffect(() => {
    loadDraftFromLocalStorage();
    loadOrCreateDraftSubmission();
  }, []);

  const saveDraftToLocalStorage = () => {
    const draft = {
      reflections,
      artifacts: artifacts.map(a => ({ ...a, file: undefined })), // Don't store File objects
      questions,
      confidence: confidence[0],
      whatWentWell,
      whatWasChallenging,
      readyForNext,
      timestamp: Date.now()
    };
    localStorage.setItem(`project_draft_${assignment.id}_${studentId}`, JSON.stringify(draft));
  };

  const loadDraftFromLocalStorage = () => {
    const draftStr = localStorage.getItem(`project_draft_${assignment.id}_${studentId}`);
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        setReflections(draft.reflections || {});
        setArtifacts(draft.artifacts || []);
        setQuestions(draft.questions || '');
        setConfidence([draft.confidence || 5]);
        setWhatWentWell(draft.whatWentWell || '');
        setWhatWasChallenging(draft.whatWasChallenging || '');
        setReadyForNext(draft.readyForNext || false);
        toast.success('Draft restored from auto-save');
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  };

  const loadOrCreateDraftSubmission = async () => {
    try {
      // Check for existing draft submission
      const { data: draftData } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignment.id)
        .eq('student_id', studentId)
        .is('submitted_at', null)
        .order('attempt_no', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (draftData) {
        setDraftSubmissionId(draftData.id);
        // Load data from submission.content if exists
        if (draftData.content) {
          const savedContent = draftData.content as any;
          if (savedContent.reflections) setReflections(savedContent.reflections);
          if (savedContent.questions) setQuestions(savedContent.questions);
          if (savedContent.student_self_assessment) {
            const assessment = savedContent.student_self_assessment;
            setConfidence([assessment.confidence || 5]);
            setWhatWentWell(assessment.what_went_well || '');
            setWhatWasChallenging(assessment.what_was_challenging || '');
            setReadyForNext(assessment.ready_for_next || false);
          }
        }
      } else {
        // Create new draft submission
        const { data: submissionData } = await supabase
          .from('submissions')
          .insert({
            assignment_id: assignment.id,
            student_id: studentId,
            attempt_no: 1,
            content: {},
            time_spent_seconds: 0,
            submitted_at: null
          })
          .select()
          .single();

        if (submissionData) {
          setDraftSubmissionId(submissionData.id);
        }
      }
    } catch (error) {
      console.error('Error loading draft submission:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${studentId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('project_artifacts')
          .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('project_artifacts')
          .getPublicUrl(fileName);

        const artifact: Artifact = {
          type: file.type.startsWith('image/') ? 'image' : 'document',
          title: file.name,
          url: urlData.publicUrl,
          caption: '',
          file
        };

        setArtifacts(prev => [...prev, artifact]);
      }
      toast.success('Files uploaded successfully!');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const removeArtifact = async (index: number) => {
    const artifact = artifacts[index];
    if (artifact.url) {
      // Extract file path from URL
      const urlParts = artifact.url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('project_artifacts') + 1).join('/');
      
      try {
        await supabase.storage
          .from('project_artifacts')
          .remove([filePath]);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
    setArtifacts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validate required fields
    const missingReflections = currentModule.prompts.filter((_, idx) => !reflections[`prompt_${idx + 1}`]);
    if (missingReflections.length > 0) {
      toast.error(`Please complete all reflection prompts (${missingReflections.length} remaining)`);
      return;
    }

    setSubmitting(true);
    try {
      const submissionContent = {
        submission_type: 'project_module',
        module_id: currentModule.id,
        module_title: currentModule.title,
        submitted_at: new Date().toISOString(),
        reflections,
        artifacts: artifacts.map(a => ({
          type: a.type,
          title: a.title,
          url: a.url,
          caption: a.caption
        })),
        questions_for_teacher: questions ? questions.split('\n').filter(q => q.trim()) : [],
        time_spent_hours: timeSpent / 3600,
        student_self_assessment: {
          confidence: confidence[0],
          what_went_well: whatWentWell,
          what_was_challenging: whatWasChallenging,
          ready_for_next: readyForNext
        }
      };

      if (draftSubmissionId) {
        // Update existing submission
        const { error } = await supabase
          .from('submissions')
          .update({
            content: submissionContent,
            submitted_at: new Date().toISOString(),
            time_spent_seconds: timeSpent
          })
          .eq('id', draftSubmissionId);

        if (error) throw error;
      } else {
        // Create new submission
        const { error } = await supabase
          .from('submissions')
          .insert({
            assignment_id: assignment.id,
            student_id: studentId,
            attempt_no: 1,
            content: submissionContent,
            submitted_at: new Date().toISOString(),
            time_spent_seconds: timeSpent
          });

        if (error) throw error;
      }

      // Clear localStorage draft
      localStorage.removeItem(`project_draft_${assignment.id}_${studentId}`);

      toast.success('Module submitted! Getting AI teacher feedback...');
      
      // Trigger AI review
      setReviewingWithAI(true);
      await getAIReview(submissionContent);
      
    } catch (error) {
      console.error('Error submitting module:', error);
      toast.error('Failed to submit module');
    } finally {
      setSubmitting(false);
    }
  };

  const getAIReview = async (submissionContent: any) => {
    try {
      // Get student full profile
      const { data: studentData } = await supabase
        .from('students')
        .select('name, dob, personality_type, special_interests, learning_profile')
        .eq('id', studentId)
        .single();

      const studentAge = studentData?.dob 
        ? new Date().getFullYear() - new Date(studentData.dob).getFullYear() 
        : null;

      const learningProfile = studentData?.learning_profile as any;

      const { data: feedbackData, error: reviewError } = await supabase.functions.invoke('review-project-module', {
        body: {
          student_profile: {
            name: studentData?.name || 'Student',
            age: studentAge,
            mbti: studentData?.personality_type,
            interests: studentData?.special_interests || [],
            prior_knowledge: learningProfile?.prior_knowledge || 'Beginner level'
          },
          module: {
            id: currentModule.id,
            title: currentModule.title,
            description: currentModule.description,
            guidance: currentModule.guidance,
            prompts: currentModule.prompts
          },
          submission: {
            ...submissionContent,
            assignment_id: assignment.id,
            student_id: studentId
          },
          course_context: {
            title: assignment.curriculum_items?.courses?.title,
            subject: assignment.curriculum_items?.courses?.subject
          }
        }
      });

      if (reviewError) throw reviewError;

      setFeedback(feedbackData.feedback);
      setShowFeedback(true);
      toast.success('AI teacher feedback received!');
    } catch (error) {
      console.error('Error getting AI review:', error);
      toast.error('Failed to get AI feedback, but your work is saved');
    } finally {
      setReviewingWithAI(false);
    }
  };

  if (!currentModule) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No project modules found for this assignment.</p>
        </CardContent>
      </Card>
    );
  }

  // If feedback is showing, display that instead
  if (showFeedback && feedback) {
    return (
      <div className="space-y-6">
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                AI Teacher Feedback
              </CardTitle>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(feedback.overall_assessment.score * 100)}%
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  {feedback.overall_assessment.level}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Assessment */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                {feedback.overall_assessment.ready_for_next_module ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">
                    {feedback.overall_assessment.ready_for_next_module 
                      ? 'Ready for Next Module!' 
                      : 'Keep Going - Almost There!'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Estimated time to next module: {feedback.overall_assessment.estimated_time_to_next}
                  </p>
                </div>
              </div>
            </div>

            {/* Strengths */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                What You Did Well
              </h4>
              <ul className="space-y-2">
                {feedback.detailed_feedback.strengths.map((strength: string, idx: number) => (
                  <li key={idx} className="text-sm pl-4 border-l-2 border-green-500 text-muted-foreground">
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Growth */}
            {feedback.detailed_feedback.areas_for_growth.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Areas to Develop</h4>
                <ul className="space-y-2">
                  {feedback.detailed_feedback.areas_for_growth.map((area: string, idx: number) => (
                    <li key={idx} className="text-sm pl-4 border-l-2 border-amber-500 text-muted-foreground">
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specific Suggestions */}
            {feedback.detailed_feedback.specific_suggestions.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold">Specific Feedback on Your Responses</h4>
                {feedback.detailed_feedback.specific_suggestions.map((suggestion: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium mb-2">{suggestion.prompt}</p>
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.feedback}</p>
                      {suggestion.example && (
                        <div className="mt-2 p-3 bg-muted rounded text-sm">
                          <p className="text-xs font-medium mb-1">Example:</p>
                          {suggestion.example}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Answers to Questions */}
            {feedback.answers_to_questions.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold">Answers to Your Questions</h4>
                {feedback.answers_to_questions.map((qa: any, idx: number) => (
                  <Card key={idx} className="border-primary/20">
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium mb-2">Q: {qa.question}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{qa.answer}</p>
                      {qa.follow_up_resources && qa.follow_up_resources.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium mb-1">Resources:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {qa.follow_up_resources.map((resource: string, ridx: number) => (
                              <li key={ridx}>• {resource}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Coaching for Next Module */}
            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Getting Ready for Next Module</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Focus On:</p>
                  <p className="text-sm text-muted-foreground">{feedback.coaching_for_next_module.what_to_focus_on}</p>
                </div>
                
                {feedback.coaching_for_next_module.preparation_tips.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Preparation Tips:</p>
                    <ul className="space-y-1">
                      {feedback.coaching_for_next_module.preparation_tips.map((tip: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground pl-4">• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-primary">{feedback.coaching_for_next_module.encouragement}</p>
                </div>

                {feedback.coaching_for_next_module.challenge && (
                  <div className="p-3 bg-background rounded">
                    <p className="text-xs font-medium mb-1">Challenge:</p>
                    <p className="text-sm">{feedback.coaching_for_next_module.challenge}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => setShowFeedback(false)}>
                Return to Module
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                {currentModule.title}
              </CardTitle>
              <CardDescription className="mt-2">{currentModule.description}</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Module {currentModuleIndex + 1} of {modules.length}</p>
              <Progress value={((currentModuleIndex + 1) / modules.length) * 100} className="w-32 mt-2" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Guidance */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4" />
            Guidance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{currentModule.guidance}</p>
        </CardContent>
      </Card>

      {/* Reflection Prompts */}
      <Card>
        <CardHeader>
          <CardTitle>Your Work</CardTitle>
          <CardDescription>Reflect on each prompt thoughtfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentModule.prompts.map((prompt, idx) => {
            const editor = createEditor(idx);
            return (
              <div key={idx} className="space-y-2">
                <Label className="text-base font-medium">
                  Prompt {idx + 1}: {prompt}
                </Label>
                <div className="border rounded-lg p-3 min-h-[200px] prose prose-sm max-w-none">
                  <EditorContent editor={editor} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                  >
                    Bold
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                  >
                    Italic
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  >
                    Underline
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  >
                    Bullet List
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Artifacts Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Work Artifacts
          </CardTitle>
          <CardDescription>
            Add images, documents, or other files that show your work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Images, PDFs, documents (max 10MB each)
              </p>
            </label>
          </div>

          {artifacts.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Files</Label>
              {artifacts.map((artifact, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                  {artifact.type === 'image' ? (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{artifact.title}</p>
                    <input
                      type="text"
                      placeholder="Add a caption (optional)"
                      value={artifact.caption || ''}
                      onChange={(e) => {
                        const newArtifacts = [...artifacts];
                        newArtifacts[idx].caption = e.target.value;
                        setArtifacts(newArtifacts);
                      }}
                      className="text-xs text-muted-foreground mt-1 w-full bg-transparent border-none focus:outline-none"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeArtifact(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions for Teacher */}
      <Card>
        <CardHeader>
          <CardTitle>Questions for Your Teacher</CardTitle>
          <CardDescription>
            Ask anything you're unsure about or want feedback on
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., How do I know if my story hook is compelling enough?"
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Self-Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Self-Assessment (Optional)</CardTitle>
          <CardDescription>
            Reflect on your learning process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>How confident do you feel about this module?</Label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Not confident</span>
              <Slider
                value={confidence}
                onValueChange={setConfidence}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">Very confident</span>
              <span className="text-sm font-medium w-8 text-center">{confidence[0]}/10</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>What went well?</Label>
            <Textarea
              placeholder="What are you proud of in this module?"
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>What was challenging?</Label>
            <Textarea
              placeholder="What did you struggle with or find difficult?"
              value={whatWasChallenging}
              onChange={(e) => setWhatWasChallenging(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="ready"
              checked={readyForNext}
              onCheckedChange={(checked) => setReadyForNext(checked as boolean)}
            />
            <Label htmlFor="ready" className="text-sm font-normal cursor-pointer">
              I feel ready to move on to the next module
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Time spent: {Math.floor(timeSpent / 3600)}h {Math.floor((timeSpent % 3600) / 60)}m
        </p>
        <Button
          onClick={handleSubmit}
          disabled={submitting || reviewingWithAI}
          size="lg"
        >
          {submitting ? 'Submitting...' : reviewingWithAI ? 'Getting AI Feedback...' : 'Submit Module for Review'}
        </Button>
      </div>
    </div>
  );
}
