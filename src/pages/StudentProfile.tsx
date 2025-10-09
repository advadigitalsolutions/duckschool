import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Upload, User } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ProfileAssessment } from '@/components/ProfileAssessment';
import { Switch } from '@/components/ui/switch';
import { useBionicReading } from '@/contexts/BionicReadingContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const defaultAvatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasmine',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Princess',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lucky',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2',
];

export default function StudentProfile() {
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { enabled: bionicEnabled, setEnabled: setBionicEnabled } = useBionicReading();
  const {
    dyslexiaFontEnabled,
    lineSpacing,
    letterSpacing,
    colorOverlay,
    focusModeEnabled,
    readingRulerEnabled,
    textToSpeechEnabled,
    highContrastEnabled,
    setDyslexiaFont,
    setLineSpacing,
    setLetterSpacing,
    setColorOverlay,
    setFocusMode,
    setReadingRuler,
    setTextToSpeech,
    setHighContrast,
  } = useAccessibility();

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: studentData, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setStudent(studentData);
      setDisplayName(studentData.display_name || studentData.name);
      setSelectedAvatar(studentData.avatar_url || defaultAvatars[0]);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

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

      setSelectedAvatar(publicUrl);
      toast.success('Avatar uploaded!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('students')
        .update({
          display_name: displayName,
          avatar_url: selectedAvatar,
        })
        .eq('id', student.id);

      if (error) throw error;
      
      toast.success('Profile updated!');
      setStudent({ ...student, display_name: displayName, avatar_url: selectedAvatar });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/student')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">My Profile</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="assessment">
              Learning Assessment
              {!student?.profile_assessment_completed && (
                <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Customize your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={selectedAvatar} />
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
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Or choose a fun avatar:</Label>
                  <div className="grid grid-cols-4 gap-4">
                    {defaultAvatars.map((avatar, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`rounded-full border-2 transition-all ${
                          selectedAvatar === avatar
                            ? 'border-primary scale-110'
                            : 'border-transparent hover:border-muted-foreground'
                        }`}
                      >
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={avatar} />
                          <AvatarFallback>
                            <User className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    ))}
                  </div>
                </div>

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

                <Button onClick={handleSaveProfile} className="w-full">
                  Save Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Accessibility Settings</CardTitle>
                <CardDescription>Customize your reading experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Reading Assistance */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Reading Assistance</h3>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="bionic">Bionic Reading</Label>
                      <p className="text-xs text-muted-foreground">
                        Bold the first letters of words to help your brain parse text faster
                      </p>
                    </div>
                    <Switch
                      id="bionic"
                      checked={bionicEnabled}
                      onCheckedChange={setBionicEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="dyslexia-font">Dyslexia-Friendly Font</Label>
                      <p className="text-xs text-muted-foreground">
                        Use OpenDyslexic font designed for easier reading
                      </p>
                    </div>
                    <Switch
                      id="dyslexia-font"
                      checked={dyslexiaFontEnabled}
                      onCheckedChange={setDyslexiaFont}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="reading-ruler">Reading Ruler</Label>
                      <p className="text-xs text-muted-foreground">
                        Follow text with a highlighted line as you read
                      </p>
                    </div>
                    <Switch
                      id="reading-ruler"
                      checked={readingRulerEnabled}
                      onCheckedChange={setReadingRuler}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="text-to-speech">Text-to-Speech</Label>
                      <p className="text-xs text-muted-foreground">
                        Listen to text read aloud using natural voice
                      </p>
                    </div>
                    <Switch
                      id="text-to-speech"
                      checked={textToSpeechEnabled}
                      onCheckedChange={setTextToSpeech}
                    />
                  </div>
                </div>

                {/* Spacing & Layout */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Spacing & Layout</h3>
                  
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label htmlFor="line-spacing">Line Spacing</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Adjust space between lines for easier reading
                    </p>
                    <Select value={lineSpacing} onValueChange={(value: any) => setLineSpacing(value)}>
                      <SelectTrigger id="line-spacing">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal (1.0)</SelectItem>
                        <SelectItem value="1.5x">Relaxed (1.5x)</SelectItem>
                        <SelectItem value="2x">Spacious (2x)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 border rounded-lg space-y-2">
                    <Label htmlFor="letter-spacing">Letter Spacing</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Adjust space between letters
                    </p>
                    <Select value={letterSpacing} onValueChange={(value: any) => setLetterSpacing(value)}>
                      <SelectTrigger id="letter-spacing">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="wide">Wide (+0.05em)</SelectItem>
                        <SelectItem value="wider">Wider (+0.1em)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Visual Comfort */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Visual Comfort</h3>
                  
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label htmlFor="color-overlay">Color Overlay</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Add a tinted background to reduce eye strain
                    </p>
                    <Select value={colorOverlay} onValueChange={(value: any) => setColorOverlay(value)}>
                      <SelectTrigger id="color-overlay">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="cream">Cream</SelectItem>
                        <SelectItem value="mint">Mint</SelectItem>
                        <SelectItem value="lavender">Lavender</SelectItem>
                        <SelectItem value="peach">Peach</SelectItem>
                        <SelectItem value="aqua">Aqua</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="focus-mode">Focus Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Highlight active section and dim surroundings
                      </p>
                    </div>
                    <Switch
                      id="focus-mode"
                      checked={focusModeEnabled}
                      onCheckedChange={setFocusMode}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="high-contrast">High Contrast Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Increase contrast for better visibility
                      </p>
                    </div>
                    <Switch
                      id="high-contrast"
                      checked={highContrastEnabled}
                      onCheckedChange={setHighContrast}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessment">
            <ProfileAssessment 
              studentId={student?.id} 
              onComplete={fetchStudentProfile}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
