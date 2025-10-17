import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users, Edit } from 'lucide-react';
import { useChores, useChoreAssignments, Chore } from '@/hooks/useChores';
import { ChoreCard } from './ChoreCard';
import { ChoreVerificationQueue } from './ChoreVerificationQueue';
import { toast } from 'sonner';
import { z } from 'zod';

const choreSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .trim()
    .max(500, "Description must be less than 500 characters"),
  xp_reward: z.number()
    .int("XP must be a whole number")
    .min(1, "XP must be at least 1")
    .max(1000, "XP cannot exceed 1000"),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly']),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['active', 'inactive']),
});

interface Student {
  id: string;
  name: string;
}

export function ParentChoreManagement() {
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedChore, setSelectedChore] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    xp_reward: 50,
    frequency: 'once',
    priority: 'medium',
    status: 'active',
  });

  const { chores, loading, createChore, updateChore, deleteChore, refreshChores } = useChores(user?.id);
  const { assignChore } = useChoreAssignments();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, name')
      .eq('parent_id', user.id);

    if (error) {
      console.error('Error fetching students:', error);
      return;
    }
    setStudents(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      choreSchema.parse(formData);
      await createChore({
        title: formData.title,
        description: formData.description,
        xp_reward: formData.xp_reward,
        frequency: formData.frequency,
        priority: formData.priority,
        status: formData.status,
      });
      setFormData({
        title: '',
        description: '',
        xp_reward: 50,
        frequency: 'once',
        priority: 'medium',
        status: 'active',
      });
      setValidationErrors({});
      setIsDialogOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast.error('Please fix the validation errors');
      }
    }
  };

  const handleEditClick = (chore: Chore) => {
    setEditingChore(chore);
    setFormData({
      title: chore.title,
      description: chore.description || '',
      xp_reward: chore.xp_reward,
      frequency: chore.frequency,
      priority: chore.priority,
      status: chore.status,
    });
    setValidationErrors({});
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingChore) return;
    
    try {
      choreSchema.parse(formData);
      await updateChore(editingChore.id, {
        title: formData.title,
        description: formData.description,
        xp_reward: formData.xp_reward,
        frequency: formData.frequency,
        priority: formData.priority,
        status: formData.status,
      });
      setFormData({
        title: '',
        description: '',
        xp_reward: 50,
        frequency: 'once',
        priority: 'medium',
        status: 'active',
      });
      setValidationErrors({});
      setIsEditDialogOpen(false);
      setEditingChore(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast.error('Please fix the validation errors');
      }
    }
  };

  const handleAssignChore = async (studentId: string, dueDate?: string) => {
    if (!selectedChore) return;
    await assignChore(selectedChore, studentId, dueDate);
    setAssignDialogOpen(false);
    setSelectedChore(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this chore?')) {
      await deleteChore(id);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Chore Management</h2>
          <p className="text-muted-foreground">Create and assign chores to students</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Chore
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Chore</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  maxLength={100}
                />
                {validationErrors.title && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.title}</p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={500}
                />
                {validationErrors.description && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.description}</p>
                )}
              </div>
              <div>
                <Label htmlFor="xp_reward">XP Reward (1-1000)</Label>
                <Input
                  id="xp_reward"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.xp_reward}
                  onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 0 })}
                  required
                />
                {validationErrors.xp_reward && (
                  <p className="text-sm text-destructive mt-1">{validationErrors.xp_reward}</p>
                )}
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One-time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ChoreVerificationQueue />

      <Card>
        <CardHeader>
          <CardTitle>Available Chores</CardTitle>
        </CardHeader>
        <CardContent>
          {chores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No chores yet. Create one to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {chores.map((chore) => (
                <div key={chore.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <ChoreCard
                      title={chore.title}
                      description={chore.description}
                      xpReward={chore.xp_reward}
                      priority={chore.priority}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(chore)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedChore(chore.id);
                      setAssignDialogOpen(true);
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Assign
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(chore.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Chore to Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {students.map((student) => (
              <Button
                key={student.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleAssignChore(student.id)}
              >
                {student.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chore</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={100}
              />
              {validationErrors.title && (
                <p className="text-sm text-destructive mt-1">{validationErrors.title}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={500}
              />
              {validationErrors.description && (
                <p className="text-sm text-destructive mt-1">{validationErrors.description}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-xp_reward">XP Reward (1-1000)</Label>
              <Input
                id="edit-xp_reward"
                type="number"
                min="1"
                max="1000"
                value={formData.xp_reward}
                onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 0 })}
                required
              />
              {validationErrors.xp_reward && (
                <p className="text-sm text-destructive mt-1">{validationErrors.xp_reward}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">One-time</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingChore(null);
                  setValidationErrors({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
