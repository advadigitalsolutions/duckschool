import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { useXPConfig } from '@/hooks/useXP';

export function XPConfigDialog() {
  const { config, loading, updateConfig } = useXPConfig();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    assignment_completion_xp: 50,
    question_correct_xp: 10,
    daily_goal_completion_xp: 25,
    attendance_per_minute_xp: 1,
  });

  useEffect(() => {
    if (config) {
      setValues({
        assignment_completion_xp: config.assignment_completion_xp,
        question_correct_xp: config.question_correct_xp,
        daily_goal_completion_xp: config.daily_goal_completion_xp,
        attendance_per_minute_xp: config.attendance_per_minute_xp,
      });
    }
  }, [config]);

  const handleSave = async () => {
    await updateConfig(values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          XP Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>XP Configuration</DialogTitle>
          <DialogDescription>
            Configure how much XP students earn for different activities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="assignment_xp">Assignment Completion</Label>
            <div className="flex items-center gap-2">
              <Input
                id="assignment_xp"
                type="number"
                min="0"
                value={values.assignment_completion_xp}
                onChange={(e) => setValues({ ...values, assignment_completion_xp: parseInt(e.target.value) || 0 })}
              />
              <span className="text-sm text-muted-foreground">XP</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question_xp">Correct Answer</Label>
            <div className="flex items-center gap-2">
              <Input
                id="question_xp"
                type="number"
                min="0"
                value={values.question_correct_xp}
                onChange={(e) => setValues({ ...values, question_correct_xp: parseInt(e.target.value) || 0 })}
              />
              <span className="text-sm text-muted-foreground">XP</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily_goal_xp">Daily Goal Completion</Label>
            <div className="flex items-center gap-2">
              <Input
                id="daily_goal_xp"
                type="number"
                min="0"
                value={values.daily_goal_completion_xp}
                onChange={(e) => setValues({ ...values, daily_goal_completion_xp: parseInt(e.target.value) || 0 })}
              />
              <span className="text-sm text-muted-foreground">XP</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendance_xp">Attendance (per minute)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attendance_xp"
                type="number"
                min="0"
                value={values.attendance_per_minute_xp}
                onChange={(e) => setValues({ ...values, attendance_per_minute_xp: parseInt(e.target.value) || 0 })}
              />
              <span className="text-sm text-muted-foreground">XP</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
