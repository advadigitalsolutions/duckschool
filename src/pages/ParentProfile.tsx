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
import { AccessibilityControls } from '@/components/AccessibilityControls';
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
  const [pronouns, setPronouns] = useState('');
  const [customPronouns, setCustomPronouns] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
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
    availableVoices,
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
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    
    setIsAdmin(!!data);
  };

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
      
      // Load pronouns
      if (profileData.pronouns) {
        const commonPronouns = ['she/her', 'he/him', 'they/them', 'ze/hir', 'xe/xem'];
        if (commonPronouns.includes(profileData.pronouns)) {
          setPronouns(profileData.pronouns);
        } else {
          setPronouns('custom');
          setCustomPronouns(profileData.pronouns);
        }
      }
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
      
      console.log('🖼️ Starting avatar upload...');
      
      if (!profile) {
        console.error('❌ Profile not loaded');
        toast.error('Profile not loaded yet. Please try again.');
        return;
      }
      
      if (!event.target.files || event.target.files.length === 0) {
        console.log('⚠️ No file selected');
        return;
      }

      const file = event.target.files[0];
      console.log('📁 File selected:', { name: file.name, size: file.size, type: file.type });
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 5MB.');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file (JPG, PNG, GIF, or WebP).');
        return;
      }
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/avatar.${fileExt}`;
      
      console.log('📤 Uploading to:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('✅ Upload successful');

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-busting timestamp to force browser to reload the new image
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      console.log('🔗 Public URL:', cacheBustedUrl);
      
      setSelectedAvatar(cacheBustedUrl);
      toast.success('Avatar uploaded successfully!');
    } catch (error: any) {
      console.error('❌ Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      console.log('💾 Saving profile...');
      
      if (!displayName.trim()) {
        toast.error('Display name cannot be empty');
        return;
      }
      
      const finalPronouns = pronouns === 'custom' ? customPronouns : (pronouns === 'prefer-not-to-say' ? null : pronouns);
      
      console.log('📝 Profile data:', {
        name: displayName,
        avatar_url: selectedAvatar,
        pronouns: finalPronouns,
        profile_id: profile.id
      });
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: displayName,
          avatar_url: selectedAvatar,
          pronouns: finalPronouns || null,
        })
        .eq('id', profile.id);

      if (error) {
        console.error('❌ Update error:', error);
        throw error;
      }
      
      console.log('✅ Profile saved successfully');
      toast.success('Profile updated successfully!');
      setProfile({ ...profile, name: displayName, avatar_url: selectedAvatar, pronouns: finalPronouns });
    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile. Please try again.');
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
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/seed-standards')}>
                Admin Dashboard
              </Button>
            )}
            <ThemeToggle />
          </div>
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
                <CardTitle>Quick Access Controls</CardTitle>
                <CardDescription>Toggle accessibility features on/off with one click or keyboard shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <AccessibilityControls />
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Customize your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div className="space-y-2">
                  <Label htmlFor="pronouns">Pronouns (optional)</Label>
                  <Select value={pronouns} onValueChange={setPronouns}>
                    <SelectTrigger id="pronouns" className="bg-background">
                      <SelectValue placeholder="Select your pronouns" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
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
                  <p className="text-xs text-muted-foreground">
                    <BionicText>Your pronouns help others respect your identity</BionicText>
                  </p>
                </div>

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

                <Button onClick={handleSaveProfile} className="w-full">
                  Save Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Advanced Accessibility Settings</CardTitle>
                <CardDescription>Fine-tune your reading experience</CardDescription>
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

                  {textToSpeechEnabled && availableVoices.length > 0 && (
                    <div className="p-4 border rounded-lg space-y-2 animate-fade-in">
                      <Label htmlFor="tts-voice"><BionicText>Voice Selection</BionicText></Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        <BionicText>Choose your preferred reading voice</BionicText>
                      </p>
                      <Select value={textToSpeechVoice} onValueChange={(value: string) => setTextToSpeechVoice(value)}>
                        <SelectTrigger id="tts-voice">
                          <SelectValue placeholder="Select a voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVoices.map((voice) => (
                            <SelectItem key={voice.name} value={voice.name}>
                              {voice.name} ({voice.lang})
                            </SelectItem>
                          ))}
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
