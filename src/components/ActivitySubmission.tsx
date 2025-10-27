import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, Dumbbell, Clock, TrendingUp, Camera } from 'lucide-react';
import { cleanMarkdown } from '@/utils/textFormatting';
import { useXPConfig } from '@/hooks/useXP';
import { BionicText } from './BionicText';
import { Badge } from '@/components/ui/badge';
import { useActivitySession } from '@/hooks/useActivitySession';
import { useIdleDetection } from '@/hooks/useIdleDetection';
import { useWindowVisibility } from '@/hooks/useWindowVisibility';

interface ActivitySubmissionProps {
  assignment: any;
  studentId: string;
}

const ACTIVITY_TYPES = [
  'Gym Session',
  'Home Workout',
  'Rock Climbing',
  'Running',
  'Swimming',
  'Cycling',
  'Team Sport',
  'Yoga/Stretching',
  'Other'
];

const INTENSITY_LEVELS = [
  { value: 'light', label: 'Light', description: 'Easy pace, could hold conversation' },
  { value: 'moderate', label: 'Moderate', description: 'Challenging but sustainable' },
  { value: 'vigorous', label: 'Vigorous', description: 'Hard effort, short bursts' },
  { value: 'intense', label: 'Intense', description: 'Maximum effort' }
];

export function ActivitySubmission({ assignment, studentId }: ActivitySubmissionProps) {
  const [activityType, setActivityType] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('');
  const [reflection, setReflection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previousSubmissions, setPreviousSubmissions] = useState<any[]>([]);
  const [loadingPrevious, setLoadingPrevious] = useState(true);

  const { config: xpConfig } = useXPConfig();

  // Time tracking
  const { sessionId, createSession, endSession, updateActiveTime, updateIdleTime, updateAwayTime } = useActivitySession(studentId);
  
  const { isIdle } = useIdleDetection({
    idleThreshold: 60000
  });
  
  const { isVisible } = useWindowVisibility();

  // Create session when form opens (not submitted yet)
  useEffect(() => {
    if (studentId && !sessionId && !loadingPrevious && !submitted) {
      createSession();
    }
  }, [studentId, sessionId, loadingPrevious, submitted, createSession]);

  // Track active/idle/away time every second
  useEffect(() => {
    if (!sessionId || submitted) return;

    const interval = setInterval(() => {
      if (!isVisible) {
        updateAwayTime(1);
      } else if (isIdle) {
        updateIdleTime(1);
      } else {
        updateActiveTime(1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, submitted, isVisible, isIdle, updateActiveTime, updateIdleTime, updateAwayTime]);

  const activityDetails = typeof assignment?.curriculum_items?.body === 'string'
    ? JSON.parse(assignment.curriculum_items.body)
    : assignment?.curriculum_items?.body || {};
  const activityGoals = activityDetails.goals || {};

  useEffect(() => {
    loadPreviousSubmissions();
  }, []);

  const loadPreviousSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignment.id)
        .eq('student_id', studentId)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      setPreviousSubmissions(data || []);
      
      // Check if already submitted
      if (data && data.length > 0) {
        setSubmitted(true);
        // Load last submission data
        const lastSubmission = data[0];
        if (lastSubmission.content && typeof lastSubmission.content === 'object') {
          const content = lastSubmission.content as any;
          setActivityType(content.activity_type || '');
          setDuration(content.duration?.toString() || '');
          setIntensity(content.intensity || '');
          setReflection(content.reflection || '');
        }
      }
    } catch (error) {
      console.error('Error loading previous submissions:', error);
    } finally {
      setLoadingPrevious(false);
    }
  };

  const handleSubmit = async () => {
    if (!activityType || !duration || !intensity) {
      toast.error('Please fill in all required fields');
      return;
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      toast.error('Please enter a valid duration');
      return;
    }

    setSubmitting(true);

    try {
      // Create submission
      const submissionData = {
        assignment_id: assignment.id,
        student_id: studentId,
        submitted_at: new Date().toISOString(),
        content: {
          activity_type: activityType,
          duration: durationNum,
          intensity: intensity,
          reflection: reflection
        },
        time_spent_seconds: durationNum * 60 // Convert minutes to seconds
      };

      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .insert(submissionData)
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Award XP for activity completion
      const xpAmount = xpConfig?.assignment_completion_xp || 50;
      
      const { error: xpError } = await supabase
        .from('xp_events')
        .insert({
          student_id: studentId,
          event_type: 'activity_completion',
          amount: xpAmount,
          reference_id: assignment.id,
          description: `Completed ${activityType} activity`
        });

      if (xpError) console.error('Error awarding XP:', xpError);

      // Create a passing grade for the activity
      const { error: gradeError } = await supabase
        .from('grades')
        .insert([{
          assignment_id: assignment.id,
          student_id: studentId,
          score: 100,
          max_score: 100,
          grader: 'ai' as const,
          notes: `Completed ${activityType} for ${duration} minutes at ${intensity} intensity`
        }]);

      if (gradeError) console.error('Error creating grade:', gradeError);

      toast.success('Activity logged successfully! 🎉');
      setSubmitted(true);
      
      // End the time tracking session
      if (sessionId) {
        endSession('manual');
      }
      
      // Reload submissions to show the new one
      loadPreviousSubmissions();
    } catch (error: any) {
      console.error('Error submitting activity:', error);
      toast.error(error.message || 'Failed to log activity');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPrevious) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Activity Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activityDetails.description && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <BionicText>{cleanMarkdown(activityDetails.description)}</BionicText>
            </div>
          )}

          {activityGoals && Object.keys(activityGoals).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Goals for this activity:</h4>
              <div className="flex flex-wrap gap-2">
                {activityGoals.min_duration && (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {activityGoals.min_duration}+ minutes
                  </Badge>
                )}
                {activityGoals.intensity && (
                  <Badge variant="outline">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {activityGoals.intensity} intensity
                  </Badge>
                )}
                {activityGoals.focus && (
                  <Badge variant="outline">{activityGoals.focus}</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Logging Form */}
      {!submitted && (
        <Card>
          <CardHeader>
            <CardTitle>Log Your Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activity-type">Activity Type *</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger id="activity-type">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="intensity">Intensity Level *</Label>
              <Select value={intensity} onValueChange={setIntensity}>
                <SelectTrigger id="intensity">
                  <SelectValue placeholder="Select intensity level" />
                </SelectTrigger>
                <SelectContent>
                  {INTENSITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-xs text-muted-foreground">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reflection">Reflection (optional)</Label>
              <Textarea
                id="reflection"
                placeholder="How did you feel? What went well? What was challenging?"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !activityType || !duration || !intensity}
              className="w-full"
              size="lg"
            >
              {submitting ? 'Logging Activity...' : 'Log Activity'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Previous Submissions */}
      {previousSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Activity Logged
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {previousSubmissions.map((sub, idx) => (
              <div key={sub.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{sub.content.activity_type}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(sub.submitted_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {sub.content.duration} min
                  </Badge>
                  <Badge variant="secondary">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {sub.content.intensity}
                  </Badge>
                </div>
                {sub.content.reflection && (
                  <div className="text-sm text-muted-foreground mt-2">
                    <strong>Reflection:</strong> {sub.content.reflection}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
