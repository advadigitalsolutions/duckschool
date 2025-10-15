import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Upload, User, X } from 'lucide-react';
import { AccessibilityControls } from '@/components/AccessibilityControls';
import { BionicText } from '@/components/BionicText';
import { ProfileAssessment } from '@/components/ProfileAssessment';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBionicReading } from '@/contexts/BionicReadingContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
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

interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
  onProfileUpdate: () => void;
  initialTab?: 'profile' | 'accessibility' | 'assessment';
}

export function ProfileSettingsModal({
  open,
  onOpenChange,
  student,
  onProfileUpdate,
  initialTab = 'profile',
}: ProfileSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'accessibility' | 'assessment'>(initialTab);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [uploading, setUploading] = useState(false);
  const [specialInterests, setSpecialInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [customPronouns, setCustomPronouns] = useState('');
  
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
    if (open && student) {
      setDisplayName(student.display_name || student.name);
      setSelectedAvatar(student.avatar_url || defaultAvatars[0]);
      setSpecialInterests((student.special_interests as string[]) || []);
      
      if (student.pronouns) {
        const commonPronouns = ['she/her', 'he/him', 'they/them', 'ze/hir', 'xe/xem'];
        if (commonPronouns.includes(student.pronouns)) {
          setPronouns(student.pronouns);
        } else {
          setPronouns('custom');
          setCustomPronouns(student.pronouns);
        }
      }
      setActiveTab(initialTab);
    }
  }, [open, student, initialTab]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!student) {
        toast.error('Profile not loaded yet. Please try again.');
        return;
      }
      
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

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      setSelectedAvatar(cacheBustedUrl);
      
      const { error: updateError } = await supabase
        .from('students')
        .update({ avatar_url: cacheBustedUrl })
        .eq('id', student.id);
      
      if (updateError) throw updateError;
      
      toast.success('Avatar updated!');
      onProfileUpdate();
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
      
      toast.success('Profile updated!');
      onProfileUpdate();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>My Settings</DialogTitle>
          <DialogDescription>
            Customize your profile, accessibility features, and dashboard header
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'profile' | 'accessibility' | 'assessment')} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            <TabsTrigger value="assessment" className="relative">
              Learning
              {!student?.profile_assessment_completed && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 min-h-0 pr-4">
            <TabsContent value="profile" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Customize your profile</CardDescription>
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
                      <BionicText>Your pronouns help others respect your identity 🏳️‍🌈</BionicText>
                    </p>
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
                      <BionicText>Your AI coach will personalize lessons based on your interests!</BionicText>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="accessibility" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Access Controls</CardTitle>
                  <CardDescription>Toggle accessibility features on/off with one click or keyboard shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <AccessibilityControls />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Advanced Accessibility Settings</CardTitle>
                  <CardDescription>Fine-tune your reading experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                          <BionicText>Visual guide that follows your cursor to help maintain reading focus</BionicText>
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
                          <BionicText>Hear selected text read aloud by selecting text and clicking the speaker icon</BionicText>
                        </p>
                      </div>
                      <Switch
                        id="text-to-speech"
                        checked={textToSpeechEnabled}
                        onCheckedChange={setTextToSpeech}
                      />
                    </div>

                    {textToSpeechEnabled && (
                      <div className="pl-4 space-y-2">
                        <Label htmlFor="tts-voice"><BionicText>Voice Selection</BionicText></Label>
                        <Select value={textToSpeechVoice || 'default'} onValueChange={setTextToSpeechVoice}>
                          <SelectTrigger id="tts-voice">
                            <SelectValue placeholder="Select a voice" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default Voice</SelectItem>
                            <SelectItem value="male">Male Voice</SelectItem>
                            <SelectItem value="female">Female Voice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Text Spacing</h3>
                    
                    <div className="space-y-2">
                      <Label>Line Spacing: {lineSpacing}</Label>
                      <Select value={lineSpacing} onValueChange={(value: any) => setLineSpacing(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="1.5x">1.5x</SelectItem>
                          <SelectItem value="2x">2x</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Letter Spacing: {letterSpacing}</Label>
                      <Select value={letterSpacing} onValueChange={(value: any) => setLetterSpacing(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="wide">Wide</SelectItem>
                          <SelectItem value="wider">Wider</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Visual Enhancements</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="color-overlay"><BionicText>Color Overlay</BionicText></Label>
                      <Select value={colorOverlay} onValueChange={setColorOverlay}>
                        <SelectTrigger id="color-overlay">
                          <SelectValue placeholder="Select overlay color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="yellow">Yellow Tint</SelectItem>
                          <SelectItem value="blue">Blue Tint</SelectItem>
                          <SelectItem value="green">Green Tint</SelectItem>
                          <SelectItem value="pink">Pink Tint</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        <BionicText>Colored overlays can reduce visual stress and improve reading comfort</BionicText>
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="focus-mode"><BionicText>Focus Mode</BionicText></Label>
                        <p className="text-xs text-muted-foreground">
                          <BionicText>Dim surrounding content to highlight what you're reading</BionicText>
                        </p>
                      </div>
                      <Switch
                        id="focus-mode"
                        checked={focusModeEnabled}
                        onCheckedChange={setFocusMode}
                      />
                    </div>

                    {focusModeEnabled && (
                      <div className="pl-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Overlay Darkness: {focusModeOverlayOpacity}%</Label>
                        <Slider
                          value={[focusModeOverlayOpacity]}
                          onValueChange={([value]) => setFocusModeOverlayOpacity(value)}
                          min={0}
                          max={100}
                          step={10}
                          className="w-full"
                        />
                      </div>

                        <div className="space-y-2">
                          <Label htmlFor="glow-color"><BionicText>Highlight Color</BionicText></Label>
                          <Select value={focusModeGlowColor} onValueChange={setFocusModeGlowColor}>
                            <SelectTrigger id="glow-color">
                              <SelectValue placeholder="Select highlight color" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yellow">Yellow</SelectItem>
                              <SelectItem value="blue">Blue</SelectItem>
                              <SelectItem value="green">Green</SelectItem>
                              <SelectItem value="purple">Purple</SelectItem>
                              <SelectItem value="white">White</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Highlight Intensity: {focusModeGlowIntensity}</Label>
                          <Slider
                            value={[focusModeGlowIntensity]}
                            onValueChange={([value]) => setFocusModeGlowIntensity(value)}
                            min={0}
                            max={100}
                            step={10}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="high-contrast"><BionicText>High Contrast Mode</BionicText></Label>
                        <p className="text-xs text-muted-foreground">
                          <BionicText>Increase contrast between text and background</BionicText>
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

            <TabsContent value="assessment" className="mt-4">
              {student && (
                <ProfileAssessment
                  studentId={student.id}
                  onComplete={onProfileUpdate}
                />
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
