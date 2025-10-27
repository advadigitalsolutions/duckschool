import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ResearchResourceValidator } from '../ResearchResourceValidator';
import { AssignmentContentRenderer } from '../AssignmentContentRenderer';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2 } from 'lucide-react';

interface ResearchPhaseProps {
  assignmentId: string;
  studentId: string;
  researchGuidance: any;
  onComplete: () => void;
  updateResearchTime?: (seconds: number) => void;
}

export const ResearchPhase: React.FC<ResearchPhaseProps> = ({
  assignmentId,
  studentId,
  researchGuidance,
  onComplete,
  updateResearchTime
}) => {
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Track research time when viewing external resources
  useEffect(() => {
    if (!updateResearchTime) return;

    const interval = setInterval(() => {
      // Count as research time if user has resources open
      if (resources.length > 0) {
        updateResearchTime(1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [resources.length, updateResearchTime]);

  const minimumResources = researchGuidance?.minimum_resources || 2;

  useEffect(() => {
    loadResources();
  }, [assignmentId, studentId]);

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignment_research')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validatedCount = resources.filter(r => r.validation_status === 'validated').length;
  const canAdvance = validatedCount >= minimumResources;

  const formatGuidance = () => {
    const suggested = researchGuidance?.suggested_sites?.map((s: string) => `• ${s}`).join('\n') || '';
    const keywords = researchGuidance?.search_keywords?.join(', ') || '';
    
    return `## 🔍 Research & Discovery\n\n**Your goal:** Find ${minimumResources} or more quality educational resources that help you understand the key concepts.\n\n**Suggested sites to search:**\n${suggested}\n\n**Search keywords:** ${keywords}\n\n**What makes a good resource?**\n- Comes from a reputable educational source\n- Explains concepts clearly with examples\n- Includes visuals, videos, or interactive elements when possible\n- Aligns with what you need to learn\n\nAdd each resource below and take notes on what you learned from it.`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-primary/20 bg-primary/5">
        <AssignmentContentRenderer content={formatGuidance()} />
      </Card>

      <ResearchResourceValidator
        assignmentId={assignmentId}
        studentId={studentId}
        resources={resources}
        onResourcesUpdated={loadResources}
        minimumResources={minimumResources}
      />

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {canAdvance ? '✓ Research complete' : `${validatedCount}/${minimumResources} resources added`}
        </p>
        <div className="flex gap-2">
          {!canAdvance && (
            <Button
              onClick={onComplete}
              variant="ghost"
              size="lg"
            >
              Skip Research
            </Button>
          )}
          <Button
            onClick={onComplete}
            size="lg"
            className="min-w-[200px]"
          >
            {canAdvance ? (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Continue to Notes
              </>
            ) : (
              'Continue Anyway'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
