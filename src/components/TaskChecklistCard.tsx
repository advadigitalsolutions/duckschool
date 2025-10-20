import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { TimeEstimateBadge } from './TimeEstimateBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ConfettiCelebration } from './ConfettiCelebration';

interface Task {
  id: string;
  text: string;
  estimatedMinutes?: number;
  isHeader?: boolean;
  level?: number;
}

interface TaskChecklistCardProps {
  assignmentId: string;
  studentId: string;
  content: string;
  onStartTimer?: (minutes: number) => void;
}

export function TaskChecklistCard({
  assignmentId,
  studentId,
  content,
  onStartTimer
}: TaskChecklistCardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Parse content into tasks
  useEffect(() => {
    const parsedTasks = parseContentIntoTasks(content);
    setTasks(parsedTasks);
  }, [content]);

  // Load saved checkbox state from database
  useEffect(() => {
    loadChecklistState();
  }, [assignmentId, studentId]);

  const parseContentIntoTasks = (text: string): Task[] => {
    const tasks: Task[] = [];
    const lines = text.split('\n');
    let taskCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Match numbered lists: "1. Task", "1) Task", "2. Task", "2) Task", etc.
      const numberedMatch = line.match(/^(\d+)[.)]\s+(.+)/);
      if (numberedMatch) {
        taskCounter++;
        tasks.push({
          id: `task-${taskCounter}`,
          text: numberedMatch[2],
          estimatedMinutes: extractTimeEstimate(numberedMatch[2])
        });
        continue;
      }

      // Match bullet points: "- Task", "* Task", "• Task"
      const bulletMatch = line.match(/^[-*•]\s+(.+)/);
      if (bulletMatch) {
        taskCounter++;
        tasks.push({
          id: `task-${taskCounter}`,
          text: bulletMatch[1],
          estimatedMinutes: extractTimeEstimate(bulletMatch[1])
        });
        continue;
      }

      // Match headers: "## Header", "### Subheader"
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headerMatch) {
        tasks.push({
          id: `header-${i}`,
          text: headerMatch[2],
          isHeader: true,
          level: headerMatch[1].length
        });
        continue;
      }

      // Match lines that start with bold text as task headers: "**Step 1:**"
      const boldHeaderMatch = line.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
      if (boldHeaderMatch) {
        taskCounter++;
        tasks.push({
          id: `task-${taskCounter}`,
          text: boldHeaderMatch[1] + (boldHeaderMatch[2] ? ': ' + boldHeaderMatch[2] : ''),
          estimatedMinutes: extractTimeEstimate(line)
        });
        continue;
      }
    }

    return tasks;
  };

  const extractTimeEstimate = (text: string): number | undefined => {
    // Look for patterns like: "15 min", "(20 minutes)", "~30 mins"
    const timeMatch = text.match(/[(\[]?~?(\d+)\s*(min|minute|minutes)[)\]]?/i);
    return timeMatch ? parseInt(timeMatch[1]) : undefined;
  };

  const loadChecklistState = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_learning_progress')
        .select('task_checklist_state')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;

      if (data?.task_checklist_state) {
        const checkedIds = new Set<string>(data.task_checklist_state as string[]);
        setCheckedTasks(checkedIds);
      }
    } catch (error) {
      console.error('Error loading checklist state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveChecklistState = async (newCheckedTasks: Set<string>) => {
    try {
      const checkedArray = Array.from(newCheckedTasks);
      const completedCount = checkedArray.length;
      const currentTask = tasks.findIndex(t => !t.isHeader && !newCheckedTasks.has(t.id));

      const { error } = await supabase
        .from('assignment_learning_progress')
        .upsert({
          assignment_id: assignmentId,
          student_id: studentId,
          task_checklist_state: checkedArray,
          subtasks_completed: completedCount,
          current_subtask: currentTask >= 0 ? currentTask : tasks.filter(t => !t.isHeader).length
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving checklist state:', error);
      toast.error('Failed to save progress');
    }
  };

  const handleTaskToggle = (taskId: string) => {
    const newCheckedTasks = new Set(checkedTasks);
    
    if (newCheckedTasks.has(taskId)) {
      newCheckedTasks.delete(taskId);
    } else {
      newCheckedTasks.add(taskId);
    }

    setCheckedTasks(newCheckedTasks);
    saveChecklistState(newCheckedTasks);

    // Check if all tasks are complete
    const allTaskIds = tasks.filter(t => !t.isHeader).map(t => t.id);
    const allComplete = allTaskIds.every(id => newCheckedTasks.has(id));
    
    if (allComplete && allTaskIds.length > 0) {
      setShowConfetti(true);
      toast.success('🎉 All tasks completed! Great work!');
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  if (isLoading) {
    return null;
  }

  const actualTasks = tasks.filter(t => !t.isHeader);
  const completedCount = actualTasks.filter(t => checkedTasks.has(t.id)).length;
  const totalCount = actualTasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (tasks.length === 0) {
    return null;
  }

  return (
    <>
      {showConfetti && (
        <ConfettiCelebration 
          active={showConfetti} 
          onComplete={() => setShowConfetti(false)} 
        />
      )}
      
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Task Checklist</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completedCount} of {totalCount} complete
            </span>
          </CardTitle>
          <Progress 
            value={progressPercentage} 
            variant={progressPercentage === 100 ? 'success' : 'default'}
            className="mt-2"
          />
        </CardHeader>
        
        <CardContent className="space-y-3">
          {tasks.map((task) => {
            if (task.isHeader) {
              return (
                <div 
                  key={task.id}
                  className={`font-semibold text-foreground mt-4 first:mt-0 ${
                    task.level === 1 ? 'text-lg' : 
                    task.level === 2 ? 'text-base' : 'text-sm'
                  }`}
                >
                  {task.text}
                </div>
              );
            }

            const isChecked = checkedTasks.has(task.id);

            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-2 rounded-md transition-colors ${
                  isChecked ? 'bg-muted/50' : 'hover:bg-muted/30'
                }`}
              >
                <Checkbox
                  id={task.id}
                  checked={isChecked}
                  onCheckedChange={() => handleTaskToggle(task.id)}
                  className="mt-1"
                />
                <label
                  htmlFor={task.id}
                  className={`flex-1 cursor-pointer select-none ${
                    isChecked ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {task.text.replace(/[(\[]?~?\d+\s*(min|minute|minutes)[)\]]?/gi, '').trim()}
                </label>
                {task.estimatedMinutes && onStartTimer && (
                  <TimeEstimateBadge
                    estimatedMinutes={task.estimatedMinutes}
                    onStartTimer={() => onStartTimer(task.estimatedMinutes!)}
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}
