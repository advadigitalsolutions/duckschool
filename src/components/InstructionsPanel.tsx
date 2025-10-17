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

  // Extract reading passages from questions (they're often embedded there)
  const extractReadingPassages = () => {
    const passages: Array<{ title: string; content: string }> = [];
    
    // Check questions for embedded passages
    if (content.questions) {
      content.questions.forEach((q: any, idx: number) => {
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
  const hasReadings = content.reading_materials?.length > 0 || embeddedPassages.length > 0;
  const hasActivities = content.activities?.length > 0;
  const hasInstructions = content.instructions;

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
                <TextToSpeech text={cleanMarkdown(content.instructions)}>
                  <AssignmentContentRenderer 
                    content={content.instructions} 
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
                  {/* Reading materials from content.reading_materials */}
                  {content.reading_materials?.map((material: any, idx: number) => (
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
                          {(content.reading_materials?.length || 0) + idx + 1}
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
                  {content.activities.map((activity: any, idx: number) => (
                    <div key={idx} className="relative pl-8 pb-4 last:pb-0">
                      {/* Timeline connector */}
                      {idx < content.activities.length - 1 && (
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
