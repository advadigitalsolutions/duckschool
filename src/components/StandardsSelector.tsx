import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Search, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Standard {
  id: string;
  code: string;
  text: string;
  subject: string;
  grade_band: string;
  framework: string;
}

interface StandardsSelectorProps {
  selectedStandards: string[];
  onChange: (standards: string[]) => void;
  framework?: string;
  gradeLevel?: string;
  subject?: string;
}

export function StandardsSelector({ 
  selectedStandards, 
  onChange, 
  framework,
  gradeLevel,
  subject 
}: StandardsSelectorProps) {
  const [search, setSearch] = useState('');
  const [standards, setStandards] = useState<Standard[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStandards();
  }, [framework, gradeLevel, subject]);

  useEffect(() => {
    loadSelectedDetails();
  }, [selectedStandards]);

  const loadStandards = async () => {
    if (!framework) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('standards')
        .select('*')
        .eq('framework', framework);

      if (subject) {
        query = query.eq('subject', subject);
      }

      if (gradeLevel) {
        // Match grade band (e.g., "9-10" for grade 10)
        const gradeNum = parseInt(gradeLevel.replace(/\D/g, ''));
        if (!isNaN(gradeNum)) {
          query = query.or(`grade_band.eq.${gradeNum},grade_band.like.%${gradeNum}%`);
        }
      }

      query = query.order('code').limit(100);

      const { data, error } = await query;
      if (error) throw error;
      setStandards(data || []);
    } catch (error: any) {
      console.error('Error loading standards:', error);
      toast.error('Failed to load standards');
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedDetails = async () => {
    if (selectedStandards.length === 0) {
      setSelectedDetails([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('standards')
        .select('*')
        .in('code', selectedStandards);
      
      if (error) throw error;
      setSelectedDetails(data || []);
    } catch (error) {
      console.error('Error loading selected standards:', error);
    }
  };

  const toggleStandard = (code: string) => {
    if (selectedStandards.includes(code)) {
      onChange(selectedStandards.filter(s => s !== code));
    } else {
      onChange([...selectedStandards, code]);
    }
  };

  const filteredStandards = standards.filter(s => 
    search === '' || 
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.text.toLowerCase().includes(search.toLowerCase())
  );

  if (!framework) {
    return (
      <div className="text-center text-muted-foreground p-4 border rounded-lg">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Please configure your course's regional framework first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Standards */}
      {selectedDetails.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Selected Standards ({selectedDetails.length})</div>
          <div className="flex flex-wrap gap-2">
            {selectedDetails.map((standard) => (
              <Badge
                key={standard.code}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => toggleStandard(standard.code)}
              >
                {standard.code}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search standards by code or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Standards List */}
      <ScrollArea className="h-[300px] border rounded-lg">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading standards...</div>
          ) : filteredStandards.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No standards found. {search && 'Try a different search.'}
            </div>
          ) : (
            filteredStandards.map((standard) => (
              <button
                key={standard.id}
                onClick={() => toggleStandard(standard.code)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedStandards.includes(standard.code)
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted border-transparent'
                }`}
              >
                <div className="font-mono text-sm font-medium text-primary">
                  {standard.code}
                </div>
                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {standard.text}
                </div>
                {standard.grade_band && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Grade {standard.grade_band}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
