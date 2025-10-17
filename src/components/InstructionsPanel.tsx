import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { BookOpen, CheckSquare, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { AssignmentContentRenderer } from './AssignmentContentRenderer';
import { TextToSpeech } from './TextToSpeech';
import { cleanMarkdown } from '@/utils/textFormatting';

interface InstructionsPanelProps {
  content: any;
}

export const InstructionsPanel: React.FC<InstructionsPanelProps> = ({ content }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    instructions: true,
    readings: true, // Open by default since it's critical
    activities: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Ensure content is always an object
  const safeContent = content || {};
  
  // Log for debugging
  console.log('InstructionsPanel content:', safeContent);

  // Extract reading passages from questions (they're often embedded there)
  const extractReadingPassages = () => {
    const passages: Array<{ title: string; content: string }> = [];
    
    // Check questions for embedded passages
    if (safeContent.questions && Array.isArray(safeContent.questions)) {
      safeContent.questions.forEach((q: any, idx: number) => {
        if (q.question && typeof q.question === 'string') {
          // Look for passages embedded in questions
          const passageMatch = q.question.match(/Passage:\s*\n(.+?)\n\nQuestion:/s);
          if (passageMatch) {
            passages.push({
              title: `Reading Passage ${passages.length + 1}`,
              content: passageMatch[1].trim()
            });
          }
          
          // Also check for "read before answering" patterns
          const guidedMatch = q.question.match(/Guided passage \(read before answering\):\s*\nPassage:\s*\n(.+?)\n\nQuestion:/s);
          if (guidedMatch && !passageMatch) {
            passages.push({
              title: `Required Reading for Questions ${idx + 1}+`,
              content: guidedMatch[1].trim()
            });
          }
        }
      });
    }
    
    return passages;
  };

  const embeddedPassages = extractReadingPassages();
  const hasReadings = safeContent.reading_materials?.length > 0 || embeddedPassages.length > 0;
  const hasActivities = safeContent.activities?.length > 0;
  const hasInstructions = safeContent.instructions;
  const hasProgressTracker = safeContent.progress_tracker?.steps?.length > 0;
  const hasEditingChecklist = safeContent.self_editing_checklist?.steps?.length > 0;
  const hasSubmissionInstructions = safeContent.submission_instructions;
  const hasSampleResponse = safeContent.sample_student_response;

  // If no content at all, show placeholder
  if (!hasInstructions && !hasReadings && !hasActivities && !hasProgressTracker && 
      !hasEditingChecklist && !hasSubmissionInstructions && !hasSampleResponse) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No instructions available for this lesson.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Instructions */}
      {hasInstructions && (
        <Card className="border-l-4 border-l-primary">
          <Collapsible
            open={openSections.instructions}
            onOpenChange={() => toggleSection('instructions')}
          >
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="w-full flex items-center justify-between cursor-pointer group">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <CheckSquare className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>What You'll Do</span>
                </CardTitle>
                {openSections.instructions ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-hover:text-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:text-foreground" />
                )}
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <TextToSpeech text={cleanMarkdown(safeContent.instructions)}>
                  <AssignmentContentRenderer 
                    content={safeContent.instructions} 
                    className="space-y-4"
                  />
                </TextToSpeech>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Reading Materials */}
      {hasReadings && (
        <Card className="border-l-4 border-l-blue-500">
          <Collapsible
            open={openSections.readings}
            onOpenChange={() => toggleSection('readings')}
          >
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="w-full flex items-center justify-between cursor-pointer group">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <BookOpen className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <span>Required Reading</span>
                </CardTitle>
                {openSections.readings ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-hover:text-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:text-foreground" />
                )}
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-6">
                  {/* Reading materials from safeContent.reading_materials */}
                  {safeContent.reading_materials?.map((material: any, idx: number) => (
                    <div key={`rm-${idx}`} className="space-y-3">
                      {material.title && (
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-300 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-base mb-2">{material.title}</h4>
                            {material.content && (
                              <TextToSpeech text={cleanMarkdown(material.content)}>
                                <div className="bg-muted/50 rounded-lg p-4">
                                  <AssignmentContentRenderer 
                                    content={material.content}
                                    className="text-sm"
                                  />
                                </div>
                              </TextToSpeech>
                            )}
                          </div>
                        </div>
                      )}
                      {!material.title && material.content && (
                        <TextToSpeech text={cleanMarkdown(material.content)}>
                          <div className="bg-muted/50 rounded-lg p-4">
                            <AssignmentContentRenderer 
                              content={material.content}
                              className="text-sm"
                            />
                          </div>
                        </TextToSpeech>
                      )}
                    </div>
                  ))}
                  
                  {/* Embedded passages from questions */}
                  {embeddedPassages.map((passage, idx) => (
                    <div key={`ep-${idx}`} className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-300 mt-0.5">
                          {(safeContent.reading_materials?.length || 0) + idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-base mb-2">{passage.title}</h4>
                          <TextToSpeech text={passage.content}>
                            <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-5">
                              <div className="text-sm italic leading-relaxed whitespace-pre-wrap">
                                "{passage.content}"
                              </div>
                            </div>
                          </TextToSpeech>
                          <p className="text-xs text-muted-foreground mt-2">
                            📖 Read this passage carefully before starting the questions
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Activities */}
      {hasActivities && (
        <Card className="border-l-4 border-l-green-500">
          <Collapsible
            open={openSections.activities}
            onOpenChange={() => toggleSection('activities')}
          >
            <CardHeader className="pb-3">
              <CollapsibleTrigger className="w-full flex items-center justify-between cursor-pointer group">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <FileText className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Step-by-Step Activities</span>
                </CardTitle>
                {openSections.activities ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-hover:text-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:text-foreground" />
                )}
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-4">
                  {safeContent.activities.map((activity: any, idx: number) => (
                    <div key={idx} className="relative pl-8 pb-4 last:pb-0">
                      {/* Timeline connector */}
                      {idx < safeContent.activities.length - 1 && (
                        <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-green-200 dark:bg-green-800" />
                      )}
                      
                      {/* Step number circle */}
                      <div className="absolute left-0 top-1 flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">
                        {activity.step || idx + 1}
                      </div>
                      
                      <div className="space-y-2">
                        <AssignmentContentRenderer 
                          content={activity.description}
                          className="text-sm"
                        />
                        {activity.duration_minutes && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground" />
                            About {activity.duration_minutes} minutes
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Progress Tracker */}
      {hasProgressTracker && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-purple-600" />
              {safeContent.progress_tracker.title || "Your Progress"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safeContent.progress_tracker.steps.map((step: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <span className="text-xl" role="img" aria-label={step.label}>{step.emoji}</span>
                  <div>
                    <span className="font-medium">Step {step.number}:</span> {step.label}
                  </div>
                </div>
              ))}
              {safeContent.progress_tracker.note && (
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                  {safeContent.progress_tracker.note}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Self-Editing Checklist */}
      {hasEditingChecklist && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-orange-500" />
              {safeContent.self_editing_checklist.title || "Self-Editing Checklist"}
            </CardTitle>
            {safeContent.self_editing_checklist.instructions && (
              <p className="text-sm text-muted-foreground mt-2">
                {safeContent.self_editing_checklist.instructions}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safeContent.self_editing_checklist.steps.map((step: any) => (
                <div key={step.number} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                    {step.number}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{step.task}</p>
                    {step.example && (
                      <p className="text-xs text-muted-foreground italic">
                        Example: {step.example}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {safeContent.self_editing_checklist.success_note && (
                <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-3 pt-3 border-t">
                  ✓ {safeContent.self_editing_checklist.success_note}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Student Response */}
      {hasSampleResponse && (
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-teal-500" />
              {safeContent.sample_student_response.title || "Example Response"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-teal-50 dark:bg-teal-950/20 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
              <AssignmentContentRenderer 
                content={safeContent.sample_student_response.content}
                className="text-sm whitespace-pre-wrap"
              />
            </div>
            {safeContent.sample_student_response.annotations && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Why This Works:
                </p>
                {safeContent.sample_student_response.annotations.map((annotation: string, idx: number) => (
                  <p key={idx} className="text-xs text-muted-foreground pl-4 border-l-2 border-teal-300">
                    {annotation}
                  </p>
                ))}
              </div>
            )}
            {safeContent.sample_student_response.why_it_works && (
              <p className="text-sm text-muted-foreground bg-teal-50/50 dark:bg-teal-950/10 p-3 rounded border-l-2 border-teal-400">
                {safeContent.sample_student_response.why_it_works}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Instructions */}
      {hasSubmissionInstructions && (
        <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/10">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Submission Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {safeContent.submission_instructions.format_requirements && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Requirements:</p>
                <ul className="text-sm space-y-1 pl-4">
                  {safeContent.submission_instructions.format_requirements.word_count && (
                    <li>• Word count: {safeContent.submission_instructions.format_requirements.word_count}</li>
                  )}
                  {safeContent.submission_instructions.format_requirements.must_include?.map((req: string, idx: number) => (
                    <li key={idx}>• {req}</li>
                  ))}
                </ul>
              </div>
            )}
            {safeContent.submission_instructions.before_you_submit && (
              <div className="space-y-2 p-3 bg-white dark:bg-slate-900 rounded border">
                <p className="text-sm font-semibold">Before You Submit:</p>
                <div className="space-y-1">
                  {safeContent.submission_instructions.before_you_submit.map((item: string, idx: number) => (
                    <p key={idx} className="text-xs text-muted-foreground">{item}</p>
                  ))}
                </div>
              </div>
            )}
            {safeContent.submission_instructions.submission_note && (
              <p className="text-xs text-muted-foreground italic">
                {safeContent.submission_instructions.submission_note}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Helpful reminder */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>Pro tip:</strong> Read through all sections before starting. You can always come back to review!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
