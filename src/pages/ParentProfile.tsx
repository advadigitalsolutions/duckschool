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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBionicReading } from '@/contexts/BionicReadingContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { BionicText } from '@/components/BionicText';
import { Slider } from '@/components/ui/slider';
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
  avatarElephant,
  avatarWolf,
  avatarBeetle,
  avatarLadybug,
  avatarAngel,
  avatarCowboy,
  avatarWhale,
  avatarDuck,
  avatarTomato,
  avatarRabbit,
  avatarSpottedBunny,
  avatarCorgi,
  avatarAlien,
  avatarFish,
];

export default function ParentProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
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
    focusModeOverlayOpacity,
    focusModeGlowColor,
    focusModeGlowIntensity,
    readingRulerEnabled,
    textToSpeechEnabled,
    textToSpeechVoice,
    highContrastEnabled,
    setDyslexiaFont,
    setLineSpacing,
    setLetterSpacing,
    setColorOverlay,
    setFocusMode,
    setFocusModeOverlayOpacity,
    setFocusModeGlowColor,
    setFocusModeGlowIntensity,
    setReadingRuler,
    setTextToSpeech,
    setTextToSpeechVoice,
    setHighContrast,
  } = useAccessibility();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(profileData);
      setDisplayName(profileData.name || user.email?.split('@')[0] || '');
      setSelectedAvatar(profileData.avatar_url || defaultAvatars[0]);
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
      const filePath = `${profile.id}/avatar.${fileExt}`;

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
        .from('profiles')
        .update({
          name: displayName,
          avatar_url: selectedAvatar,
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success('Profile updated!');
      setProfile({ ...profile, name: displayName, avatar_url: selectedAvatar });
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/parent')}>
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
                    <AvatarImage src={selectedAvatar} className="object-cover" />
                    <AvatarFallback>
                      <User className="h-16 w-16" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-center space-y-2">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Upload className="h-4 w-4" />
                        Upload Custom Avatar (JPG, PNG, GIF)
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
                  <div className="grid grid-cols-4 gap-4">
                    {defaultAvatars.map((avatar, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`rounded-full border-2 transition-all overflow-hidden aspect-square ${
                          selectedAvatar === avatar
                            ? 'border-primary scale-110'
                            : 'border-transparent hover:border-muted-foreground'
                        }`}
                      >
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={avatar} className="object-cover" />
                          <AvatarFallback>
                            <User className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                  />
                  <p className="text-xs text-muted-foreground">
                    <BionicText>This is how your name will appear throughout the app</BionicText>
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
                      <Label htmlFor="bionic"><BionicText>Bionic Reading</BionicText></Label>
                      <p className="text-xs text-muted-foreground">
                        <BionicText>Bold the first letters of words to help your brain parse text faster</BionicText>
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
                      <Label htmlFor="dyslexia-font"><BionicText>Dyslexia-Friendly Font</BionicText></Label>
                      <p className="text-xs text-muted-foreground">
                        <BionicText>Use OpenDyslexic font designed for easier reading</BionicText>
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
                      <Label htmlFor="reading-ruler"><BionicText>Reading Ruler</BionicText></Label>
                      <p className="text-xs text-muted-foreground">
                        <BionicText>Follow text with a highlighted line as you read</BionicText>
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
                      <Label htmlFor="text-to-speech"><BionicText>Text-to-Speech</BionicText></Label>
                      <p className="text-xs text-muted-foreground">
                        <BionicText>Listen to text read aloud using natural voice</BionicText>
                      </p>
                    </div>
                    <Switch
                      id="text-to-speech"
                      checked={textToSpeechEnabled}
                      onCheckedChange={setTextToSpeech}
                    />
                  </div>

                  {textToSpeechEnabled && (
                    <div className="p-4 border rounded-lg space-y-2 animate-fade-in">
                      <Label htmlFor="tts-voice"><BionicText>Voice Selection</BionicText></Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        <BionicText>Choose your preferred reading voice</BionicText>
                      </p>
                      <Select value={textToSpeechVoice} onValueChange={(value: any) => setTextToSpeechVoice(value)}>
                        <SelectTrigger id="tts-voice">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                          <SelectItem value="echo">Echo (Male)</SelectItem>
                          <SelectItem value="fable">Fable (British Male)</SelectItem>
                          <SelectItem value="onyx">Onyx (Deep Male)</SelectItem>
                          <SelectItem value="nova">Nova (Female)</SelectItem>
                          <SelectItem value="shimmer">Shimmer (Soft Female)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Spacing & Layout */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Spacing & Layout</h3>
                  
                  <div className="p-4 border rounded-lg space-y-2">
                    <Label htmlFor="line-spacing"><BionicText>Line Spacing</BionicText></Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      <BionicText>Adjust space between lines for easier reading</BionicText>
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
                    <Label htmlFor="letter-spacing"><BionicText>Letter Spacing</BionicText></Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      <BionicText>Adjust space between letters</BionicText>
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
                    <Label htmlFor="color-overlay"><BionicText>Color Overlay</BionicText></Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      <BionicText>Add a tinted background to reduce eye strain</BionicText>
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
                      <Label htmlFor="focus-mode"><BionicText>Focus Mode</BionicText></Label>
                      <p className="text-xs text-muted-foreground">
                        <BionicText>Highlight active section and dim surroundings</BionicText>
                      </p>
                    </div>
                    <Switch
                      id="focus-mode"
                      checked={focusModeEnabled}
                      onCheckedChange={setFocusMode}
                    />
                  </div>

                  {focusModeEnabled && (
                    <>
                      <div className="p-4 border rounded-lg space-y-3">
                        <Label htmlFor="focus-opacity">Overlay Dim Amount ({focusModeOverlayOpacity}%)</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          <BionicText>Adjust how much the background is dimmed</BionicText>
                        </p>
                        <Slider
                          id="focus-opacity"
                          min={0}
                          max={100}
                          step={5}
                          value={[focusModeOverlayOpacity]}
                          onValueChange={(value) => setFocusModeOverlayOpacity(value[0])}
                          className="w-full"
                        />
                      </div>

                      <div className="p-4 border rounded-lg space-y-2">
                        <Label htmlFor="focus-glow"><BionicText>Highlight Glow Color</BionicText></Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          <BionicText>Choose the color of the glow effect on focused cards</BionicText>
                        </p>
                        <Select value={focusModeGlowColor} onValueChange={(value) => setFocusModeGlowColor(value)}>
                          <SelectTrigger id="focus-glow">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yellow">Yellow (Default)</SelectItem>
                            <SelectItem value="blue">Blue</SelectItem>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="purple">Purple</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                            <SelectItem value="rainbow">🌈 Rainbow</SelectItem>
                            <SelectItem value="trans">🏳️‍⚧️ Trans Flag</SelectItem>
                            <SelectItem value="none">No Glow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-4 border rounded-lg space-y-3">
                        <Label htmlFor="focus-glow-intensity">Glow Intensity ({focusModeGlowIntensity}%)</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          <BionicText>Adjust the strength of the glow effect</BionicText>
                        </p>
                        <Slider
                          id="focus-glow-intensity"
                          min={0}
                          max={100}
                          step={5}
                          value={[focusModeGlowIntensity]}
                          onValueChange={(value) => setFocusModeGlowIntensity(value[0])}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="high-contrast"><BionicText>High Contrast Mode</BionicText></Label>
                      <p className="text-xs text-muted-foreground">
                        <BionicText>Increase contrast for better visibility</BionicText>
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
        </Tabs>
      </div>
    </div>
  );
}
