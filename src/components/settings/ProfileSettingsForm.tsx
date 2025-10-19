import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, User, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import avatarElephant from '@/assets/avatars/avatar-elephant.png';
import avatarWolf from '@/assets/avatars/avatar-wolf.png';
import avatarBeetle from '@/assets/avatars/avatar-beetle.png';
import avatarLadybug from '@/assets/avatars/avatar-ladybug.png';
import avatarAngel from '@/assets/avatars/avatar-angel.png';
import avatarCowboy from '@/assets/avatars/avatar-cowboy.png';
import avatarWhale from '@/assets/avatars/avatar-whale.png';
import avatarDuck from '@/assets/avatars/avatar-duck.png';
import avatarTomato from '@/assets/avatars/avatar-tomato.png';
import avatarRabbit from '@/assets/avatars/avatar-rabbit.png';
import avatarSpottedBunny from '@/assets/avatars/avatar-spotted-bunny.png';
import avatarCorgi from '@/assets/avatars/avatar-corgi.png';
import avatarAlien from '@/assets/avatars/avatar-alien.png';
import avatarFish from '@/assets/avatars/avatar-fish.png';

const defaultAvatars = [
  avatarElephant, avatarWolf, avatarBeetle, avatarLadybug, avatarAngel, avatarCowboy,
  avatarWhale, avatarDuck, avatarTomato, avatarRabbit, avatarSpottedBunny, avatarCorgi,
  avatarAlien, avatarFish,
];

export function ProfileSettingsForm() {
  const [student, setStudent] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [uploading, setUploading] = useState(false);
  const [specialInterests, setSpecialInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [customPronouns, setCustomPronouns] = useState('');

  useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user is a student
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (studentData) {
      setStudent(studentData);
      setDisplayName(studentData.display_name || studentData.name);
      setSelectedAvatar(studentData.avatar_url || defaultAvatars[0]);
      setSpecialInterests((studentData.special_interests as string[]) || []);
      
      if (studentData.pronouns) {
        const commonPronouns = ['she/her', 'he/him', 'they/them', 'ze/hir', 'xe/xem'];
        if (commonPronouns.includes(studentData.pronouns)) {
          setPronouns(studentData.pronouns);
        } else {
          setPronouns('custom');
          setCustomPronouns(studentData.pronouns);
        }
      }
      return;
    }

    // If not a student, load profile data for parent
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      // Create a mock student object for parents using their profile data
      const mockStudent = {
        id: profileData.id,
        user_id: user.id,
        parent_id: user.id,
        name: profileData.name || user.email?.split('@')[0] || 'User',
        display_name: profileData.name || user.email?.split('@')[0] || 'User',
        avatar_url: profileData.avatar_url || defaultAvatars[0],
        special_interests: [],
        pronouns: profileData.pronouns,
      };
      setStudent(mockStudent);
      setDisplayName(mockStudent.display_name);
      setSelectedAvatar(mockStudent.avatar_url);
      setPronouns(profileData.pronouns || '');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!student) {
        toast.error('Profile not loaded yet. Please try again.');
        return;
      }
      
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${student.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      setSelectedAvatar(cacheBustedUrl);
      
      const { error: updateError } = await supabase
        .from('students')
        .update({ avatar_url: cacheBustedUrl })
        .eq('id', student.id);
      
      if (updateError) throw updateError;
      
      toast.success('Avatar updated!');
      fetchStudent();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const finalPronouns = pronouns === 'custom' ? customPronouns : (pronouns === 'prefer-not-to-say' ? null : pronouns);
      
      const avatarWithTimestamp = selectedAvatar?.includes('?t=') 
        ? selectedAvatar 
        : selectedAvatar 
          ? `${selectedAvatar}?t=${Date.now()}` 
          : selectedAvatar;
      
      // Check if saving student or parent profile
      if (student.parent_id === student.user_id) {
        // Parent - update profiles table
        const { error } = await supabase
          .from('profiles')
          .update({
            name: displayName,
            avatar_url: avatarWithTimestamp,
            pronouns: finalPronouns || null,
          })
          .eq('id', student.id);

        if (error) throw error;
      } else {
        // Student - update students table
        const { error } = await supabase
          .from('students')
          .update({
            display_name: displayName,
            avatar_url: avatarWithTimestamp,
            special_interests: specialInterests,
            pronouns: finalPronouns || null,
          })
          .eq('id', student.id);

        if (error) throw error;
      }
      
      toast.success('Profile updated!');
      fetchStudent();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !specialInterests.includes(newInterest.trim())) {
      setSpecialInterests([...specialInterests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setSpecialInterests(specialInterests.filter(i => i !== interest));
  };

  if (!student) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name / Nickname</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your preferred name"
            />
            <p className="text-xs text-muted-foreground">
              This is how your name will appear throughout the app
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pronouns">Pronouns (optional)</Label>
            <Select value={pronouns} onValueChange={setPronouns}>
              <SelectTrigger id="pronouns">
                <SelectValue placeholder="Select your pronouns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="she/her">she/her</SelectItem>
                <SelectItem value="he/him">he/him</SelectItem>
                <SelectItem value="they/them">they/them</SelectItem>
                <SelectItem value="ze/hir">ze/hir</SelectItem>
                <SelectItem value="xe/xem">xe/xem</SelectItem>
                <SelectItem value="custom">Custom pronouns</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
            {pronouns === 'custom' && (
              <Input
                value={customPronouns}
                onChange={(e) => setCustomPronouns(e.target.value)}
                placeholder="Enter your pronouns (e.g., fae/faer)"
                className="mt-2"
              />
            )}
          </div>

          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32" key={selectedAvatar}>
              <AvatarImage src={selectedAvatar} className="object-cover" />
              <AvatarFallback>
                <User className="h-16 w-16" />
              </AvatarFallback>
            </Avatar>

            <div className="text-center space-y-2">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Upload className="h-4 w-4" />
                  Upload Custom Avatar
                </div>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Or choose a fun avatar:</Label>
            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {defaultAvatars.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative rounded-full border-3 transition-all p-2 aspect-square flex items-center justify-center ${
                    selectedAvatar === avatar
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img 
                    src={avatar} 
                    alt="Avatar option"
                    className="w-full h-full object-contain rounded-full"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Label>Special Interests</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {specialInterests.map((interest, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {interest}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => handleRemoveInterest(interest)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                placeholder="Add an interest (e.g., dinosaurs, space)"
              />
              <Button onClick={handleAddInterest} variant="secondary">
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your AI coach will personalize lessons based on your interests!
            </p>
          </div>

          <Button onClick={handleSaveProfile} className="w-full">
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
