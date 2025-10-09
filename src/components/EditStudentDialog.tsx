import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface EditStudentDialogProps {
  student: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentUpdated: () => void;
}

export const EditStudentDialog = ({ student, open, onOpenChange, onStudentUpdated }: EditStudentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [createLogin, setCreateLogin] = useState(false);
  const [hasExistingLogin, setHasExistingLogin] = useState(false);

  useEffect(() => {
    if (student) {
      setHasExistingLogin(!!student.user_id);
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const dob = formData.get('dob') as string;
    const gradeLevel = formData.get('gradeLevel') as string;
    const accommodationsText = formData.get('accommodations') as string;
    const goalsText = formData.get('goals') as string;
    const studentEmail = formData.get('studentEmail') as string;
    const studentPassword = formData.get('studentPassword') as string;

    try {
      let studentUserId = student.user_id;

      // Create student login if requested and doesn't exist
      if (createLogin && !hasExistingLogin && studentEmail && studentPassword) {
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
      }

      const accommodations = accommodationsText 
        ? { notes: accommodationsText }
        : {};
      const goals = goalsText 
        ? { notes: goalsText }
        : {};

      const { error } = await supabase
        .from('students')
        .update({
          name,
          dob: dob || null,
          grade_level: gradeLevel,
          user_id: studentUserId,
          accommodations,
          goals,
        })
        .eq('id', student.id);

      if (error) throw error;

      toast.success(
        createLogin && !hasExistingLogin
          ? 'Student profile updated and login created!' 
          : 'Student profile updated successfully!'
      );
      onOpenChange(false);
      onStudentUpdated();
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast.error(error.message || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update student profile information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Student Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={student.name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              name="dob"
              type="date"
              defaultValue={student.dob || ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Grade Level *</Label>
            <Input
              id="gradeLevel"
              name="gradeLevel"
              defaultValue={student.grade_level || ''}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accommodations">ADHD Accommodations</Label>
            <Textarea
              id="accommodations"
              name="accommodations"
              defaultValue={student.accommodations?.notes || ''}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Learning Goals</Label>
            <Textarea
              id="goals"
              name="goals"
              defaultValue={student.goals?.notes || ''}
              rows={3}
            />
          </div>

          {!hasExistingLogin && (
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
          )}

          {hasExistingLogin && (
            <div className="text-sm text-muted-foreground border-t pt-4">
              ✓ Student has login credentials
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
