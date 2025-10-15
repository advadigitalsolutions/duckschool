import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface AddStudentDialogProps {
  onStudentAdded: () => void;
}

export const AddStudentDialog = ({ onStudentAdded }: AddStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createLogin, setCreateLogin] = useState(false);
  const [gradeLevel, setGradeLevel] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const dob = formData.get('dob') as string;
    const accommodationsText = formData.get('accommodations') as string;
    const goalsText = formData.get('goals') as string;
    const studentEmail = formData.get('studentEmail') as string;
    const studentPassword = formData.get('studentPassword') as string;

    try {
      // Get parent's session BEFORE creating student account
      const { data: { session: parentSession } } = await supabase.auth.getSession();
      if (!parentSession) throw new Error('Not authenticated');
      
      const parentUserId = parentSession.user.id;
      let studentUserId: string | null = null;

      // Create student login if requested
      if (createLogin && studentEmail && studentPassword) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: studentEmail,
          password: studentPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name,
              role: 'student'
            }
          }
        });

        if (authError) throw authError;
        studentUserId = authData.user?.id || null;
        
        if (!studentUserId) throw new Error('Failed to create student account');
        
        // CRITICAL: Restore parent's session after signUp auto-logged us in as student
        await supabase.auth.setSession({
          access_token: parentSession.access_token,
          refresh_token: parentSession.refresh_token,
        });
      }

      // Parse accommodations and goals
      const accommodations = accommodationsText 
        ? { notes: accommodationsText }
        : {};
      const goals = goalsText 
        ? { notes: goalsText }
        : {};

      const { error } = await supabase
        .from('students')
        .insert({
          name,
          dob: dob || null,
          grade_level: gradeLevel,
          parent_id: parentUserId,
          user_id: studentUserId,
          accommodations,
          goals,
        });

      if (error) throw error;

      toast.success(
        createLogin 
          ? 'Student profile and login created successfully!' 
          : 'Student profile added successfully!'
      );
      setOpen(false);
      setCreateLogin(false);
      setGradeLevel('');
      onStudentAdded();
      
      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast.error(error.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Create a student profile to start managing their homeschool curriculum
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Student Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Isaiah"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              name="dob"
              type="date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Grade Level *</Label>
            <Select value={gradeLevel} onValueChange={setGradeLevel} required>
              <SelectTrigger>
                <SelectValue placeholder="Select grade level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Preschool">Preschool</SelectItem>
                <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                <SelectItem value="1st Grade">1st Grade</SelectItem>
                <SelectItem value="2nd Grade">2nd Grade</SelectItem>
                <SelectItem value="3rd Grade">3rd Grade</SelectItem>
                <SelectItem value="4th Grade">4th Grade</SelectItem>
                <SelectItem value="5th Grade">5th Grade</SelectItem>
                <SelectItem value="6th Grade">6th Grade</SelectItem>
                <SelectItem value="7th Grade">7th Grade</SelectItem>
                <SelectItem value="8th Grade">8th Grade</SelectItem>
                <SelectItem value="9th Grade">9th Grade</SelectItem>
                <SelectItem value="10th Grade">10th Grade</SelectItem>
                <SelectItem value="11th Grade">11th Grade</SelectItem>
                <SelectItem value="12th Grade">12th Grade</SelectItem>
                <SelectItem value="Graduate School">Graduate School</SelectItem>
                <SelectItem value="Post Graduate">Post Graduate</SelectItem>
                <SelectItem value="Rogue Brainiac">Rogue Brainiac</SelectItem>
                <SelectItem value="Educator">Educator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accommodations">ADHD Accommodations</Label>
            <Textarea
              id="accommodations"
              name="accommodations"
              placeholder="e.g., Extended time, frequent breaks, visual progress indicators"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Learning Goals</Label>
            <Textarea
              id="goals"
              name="goals"
              placeholder="e.g., Complete 10th grade curriculum, prepare for GED"
              rows={3}
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createLogin"
                checked={createLogin}
                onCheckedChange={(checked) => setCreateLogin(checked === true)}
              />
              <Label 
                htmlFor="createLogin" 
                className="text-sm font-normal cursor-pointer"
              >
                Create student login account
              </Label>
            </div>

            {createLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Student Email *</Label>
                  <Input
                    id="studentEmail"
                    name="studentEmail"
                    type="email"
                    placeholder="student@example.com"
                    required={createLogin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentPassword">Student Password *</Label>
                  <Input
                    id="studentPassword"
                    name="studentPassword"
                    type="password"
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    required={createLogin}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
