import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, ExternalLink, Trash2 } from 'lucide-react';

interface Resource {
  id: string;
  resource_url: string;
  resource_title: string | null;
  resource_type: string | null;
  notes: string | null;
  validation_status: string;
  validated_at: string | null;
}

interface ResearchResourceValidatorProps {
  assignmentId: string;
  studentId: string;
  resources: Resource[];
  onResourcesUpdated: () => void;
  minimumResources?: number;
}

export const ResearchResourceValidator: React.FC<ResearchResourceValidatorProps> = ({
  assignmentId,
  studentId,
  resources,
  onResourcesUpdated,
  minimumResources = 2
}) => {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateUrl = async (urlToValidate: string): Promise<{ valid: boolean; title?: string; type?: string }> => {
    try {
      // Basic URL validation
      new URL(urlToValidate);
      
      // Try to determine resource type from URL
      let type = 'other';
      if (urlToValidate.includes('youtube.com') || urlToValidate.includes('youtu.be')) {
        type = 'video';
      } else if (urlToValidate.includes('khanacademy.org')) {
        type = 'video'; // Khan Academy is primarily video
      } else if (urlToValidate.includes('.pdf') || urlToValidate.includes('article') || urlToValidate.includes('wiki')) {
        type = 'article';
      }
      
      // Extract title from URL
      const urlObj = new URL(urlToValidate);
      let title = urlObj.hostname.replace('www.', '');
      
      // Try to make a nicer title
      if (urlObj.pathname.length > 1) {
        const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
        if (pathParts.length > 0) {
          title = pathParts[pathParts.length - 1]
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .replace(/\.[^.]+$/, '') // Remove extension
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }
      
      return { valid: true, title, type };
    } catch (error) {
      return { valid: false };
    }
  };

  const handleAddResource = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a resource URL",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    
    const validation = await validateUrl(url);
    
    if (!validation.valid) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid web address (e.g., https://...)",
        variant: "destructive"
      });
      setIsValidating(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('assignment_research')
        .insert({
          assignment_id: assignmentId,
          student_id: studentId,
          resource_url: url,
          resource_title: validation.title,
          resource_type: validation.type,
          notes: notes.trim() || null,
          validation_status: 'validated',
          validated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Resource Added!",
        description: "Your research resource has been saved"
      });

      setUrl('');
      setNotes('');
      onResourcesUpdated();
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: "Duplicate Resource",
          description: "You've already added this resource",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add resource. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from('assignment_research')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: "Resource Removed",
        description: "The resource has been deleted"
      });

      onResourcesUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove resource",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string | null) => {
    switch (type) {
      case 'video': return '🎥';
      case 'article': return '📄';
      case 'interactive': return '🎮';
      default: return '🔗';
    }
  };

  const validatedCount = resources.filter(r => r.validation_status === 'validated').length;
  const hasMinimum = validatedCount >= minimumResources;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Add Research Resource</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Resource URL</label>
            <Input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isValidating}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Notes (optional)</label>
            <Textarea
              placeholder="What did you learn from this resource?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isValidating}
              rows={2}
            />
          </div>

          <Button
            onClick={handleAddResource}
            disabled={isValidating || !url.trim()}
            className="w-full"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              'Add Resource'
            )}
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Your Resources ({validatedCount}/{minimumResources} minimum)</h3>
          {hasMinimum && (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
        </div>

        {resources.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground">
            No resources added yet. Start by adding your first research resource above.
          </Card>
        ) : (
          <div className="space-y-2">
            {resources.map((resource) => (
              <Card key={resource.id} className="p-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getTypeIcon(resource.resource_type)}</span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {resource.resource_title || 'Untitled Resource'}
                        </h4>
                        <a
                          href={resource.resource_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                        >
                          {resource.resource_url}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteResource(resource.id)}
                        className="h-8 w-8 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {resource.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{resource.notes}</p>
                    )}
                    
                    {resource.validation_status === 'validated' && (
                      <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Validated
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
