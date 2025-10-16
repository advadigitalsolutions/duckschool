import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Calendar, CheckCircle2, Circle, Edit2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TodoItem {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export const ParentTodoList = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    due_date: ''
  });

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('parent_todo_items')
        .select('*')
        .eq('parent_id', user.id)
        .order('completed', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos((data || []) as TodoItem[]);
    } catch (error: any) {
      toast.error('Failed to load to-do items');
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!formData.title.trim()) {
        toast.error('Please enter a title');
        return;
      }

      const { error } = await supabase
        .from('parent_todo_items')
        .insert([{
          parent_id: user.id,
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          due_date: formData.due_date || null
        }]);

      if (error) throw error;

      toast.success('To-do item added');
      setIsAddDialogOpen(false);
      setFormData({ title: '', description: '', priority: 'medium', due_date: '' });
      fetchTodos();
    } catch (error: any) {
      toast.error('Failed to add to-do item');
      console.error('Error adding todo:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!editingTodo) return;

      if (!formData.title.trim()) {
        toast.error('Please enter a title');
        return;
      }

      const { error } = await supabase
        .from('parent_todo_items')
        .update({
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          due_date: formData.due_date || null
        })
        .eq('id', editingTodo.id);

      if (error) throw error;

      toast.success('To-do item updated');
      setEditingTodo(null);
      setFormData({ title: '', description: '', priority: 'medium', due_date: '' });
      fetchTodos();
    } catch (error: any) {
      toast.error('Failed to update to-do item');
      console.error('Error updating todo:', error);
    }
  };

  const handleToggleComplete = async (todo: TodoItem) => {
    try {
      const { error } = await supabase
        .from('parent_todo_items')
        .update({ completed: !todo.completed })
        .eq('id', todo.id);

      if (error) throw error;

      fetchTodos();
    } catch (error: any) {
      toast.error('Failed to update to-do item');
      console.error('Error toggling complete:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('parent_todo_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('To-do item deleted');
      fetchTodos();
    } catch (error: any) {
      toast.error('Failed to delete to-do item');
      console.error('Error deleting todo:', error);
    }
  };

  const openEditDialog = (todo: TodoItem) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority || 'medium',
      due_date: todo.due_date || ''
    });
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingTodo(null);
    setFormData({ title: '', description: '', priority: 'medium', due_date: '' });
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive';
      case 'medium': return 'bg-warning/10 text-warning';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>To Do List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>To Do List</CardTitle>
            <CardDescription>Manage your tasks and reminders</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add To-Do Item</DialogTitle>
                <DialogDescription>Create a new task to track</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    placeholder="Task title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Task description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high') => 
                        setFormData({ ...formData, priority: value })
                      }
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button onClick={handleAdd}>Add Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {todos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Circle className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No tasks yet. Click "Add Task" to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`flex items-start space-x-3 rounded-lg border p-3 transition-all ${
                  todo.completed ? 'bg-muted/50 opacity-60' : 'bg-card'
                }`}
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => handleToggleComplete(todo)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {todo.title}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <Dialog open={editingTodo?.id === todo.id} onOpenChange={(open) => !open && closeDialog()}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(todo)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit To-Do Item</DialogTitle>
                            <DialogDescription>Update your task details</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Title *</label>
                              <Input
                                placeholder="Task title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Description</label>
                              <Textarea
                                placeholder="Task description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Priority</label>
                                <Select
                                  value={formData.priority}
                                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                                    setFormData({ ...formData, priority: value })
                                  }
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
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Due Date</label>
                                <Input
                                  type="date"
                                  value={formData.due_date}
                                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button onClick={handleUpdate}>Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(todo.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {todo.description && (
                    <p className={`text-sm ${todo.completed ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
                      {todo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    {todo.priority && (
                      <span className={`px-2 py-0.5 rounded-full ${getPriorityBadge(todo.priority)}`}>
                        {todo.priority}
                      </span>
                    )}
                    {todo.due_date && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(todo.due_date), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
