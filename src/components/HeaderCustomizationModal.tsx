import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface HeaderSettings {
  showName: boolean;
  customName: string | null;
  showGrade: boolean;
  customGrade: string | null;
  greetingType: 'name' | 'time-based' | 'custom';
  rotatingDisplay: 'none' | 'quote' | 'affirmation' | 'funFact';
  funFactTopic: string | null;
  locations: Array<{ name: string; timezone: string }>;
  showWeather: boolean;
  customReminders: Array<{ text: string; completed: boolean }>;
  countdowns: Array<{ name: string; date: Date; showTime: boolean }>;
  pomodoroEnabled: boolean;
  pomodoroSettings: {
    workMinutes: number;
    breakMinutes: number;
    longBreakMinutes: number;
    sessionsUntilLongBreak: number;
    visualTimer: boolean;
    timerColor: string;
    numberColor: string;
  };
  celebrateWins: boolean;
  show8BitStars: boolean;
}

interface HeaderCustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: HeaderSettings;
  onSave: (settings: HeaderSettings) => void;
  onDemo: () => void;
  studentName: string;
}

export function HeaderCustomizationModal({
  open,
  onOpenChange,
  settings: initialSettings,
  onSave,
  onDemo,
  studentName,
}: HeaderCustomizationModalProps) {
  const [settings, setSettings] = useState<HeaderSettings>(initialSettings);
  const [newLocation, setNewLocation] = useState({ name: '', timezone: '' });
  const [newReminder, setNewReminder] = useState('');
  const [newCountdown, setNewCountdown] = useState({ name: '', date: new Date(), showTime: false });

  const updateSetting = <K extends keyof HeaderSettings>(key: K, value: HeaderSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addLocation = () => {
    if (newLocation.name && newLocation.timezone && settings.locations.length < 3) {
      updateSetting('locations', [...settings.locations, newLocation]);
      setNewLocation({ name: '', timezone: '' });
    }
  };

  const removeLocation = (index: number) => {
    updateSetting('locations', settings.locations.filter((_, i) => i !== index));
  };

  const addReminder = () => {
    if (newReminder.trim()) {
      updateSetting('customReminders', [...settings.customReminders, { text: newReminder, completed: false }]);
      setNewReminder('');
    }
  };

  const removeReminder = (index: number) => {
    updateSetting('customReminders', settings.customReminders.filter((_, i) => i !== index));
  };

  const addCountdown = () => {
    if (newCountdown.name.trim()) {
      updateSetting('countdowns', [...settings.countdowns, { ...newCountdown }]);
      setNewCountdown({ name: '', date: new Date(), showTime: false });
    }
  };

  const removeCountdown = (index: number) => {
    updateSetting('countdowns', settings.countdowns.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Your Header ✨</DialogTitle>
          <DialogDescription>
            Make your dashboard feel like home with these personalization options
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="display" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="rotating">Rotating</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            <TabsContent value="display" className="space-y-4 mt-4">
              <Card className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Show Name</Label>
                    <Switch
                      checked={settings.showName}
                      onCheckedChange={(checked) => updateSetting('showName', checked)}
                    />
                  </div>
                  {settings.showName && (
                    <Input
                      placeholder={studentName}
                      value={settings.customName || ''}
                      onChange={(e) => updateSetting('customName', e.target.value || null)}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Show Grade</Label>
                    <Switch
                      checked={settings.showGrade}
                      onCheckedChange={(checked) => updateSetting('showGrade', checked)}
                    />
                  </div>
                  {settings.showGrade && (
                    <Input
                      placeholder="e.g., 8th Grade"
                      value={settings.customGrade || ''}
                      onChange={(e) => updateSetting('customGrade', e.target.value || null)}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Greeting Style</Label>
                  <Select
                    value={settings.greetingType}
                    onValueChange={(value: any) => updateSetting('greetingType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Welcome back, [Name]</SelectItem>
                      <SelectItem value="time-based">Good [morning/afternoon/evening], [Name]</SelectItem>
                      <SelectItem value="custom">Custom greeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="rotating" className="space-y-4 mt-4">
              <Card className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Rotating Display</Label>
                  <Select
                    value={settings.rotatingDisplay}
                    onValueChange={(value: any) => updateSetting('rotatingDisplay', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="quote">Inspirational Quotes (500 quotes)</SelectItem>
                      <SelectItem value="affirmation">Personal Affirmations</SelectItem>
                      <SelectItem value="funFact">Fun Facts (AI Generated)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.rotatingDisplay === 'funFact' && (
                  <div className="space-y-2">
                    <Label>Fun Facts Topic</Label>
                    <Input
                      placeholder="e.g., Space, Dinosaurs, Ocean Animals"
                      value={settings.funFactTopic || ''}
                      onChange={(e) => updateSetting('funFactTopic', e.target.value || null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      AI will generate 100 unique fun facts about this topic
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="info" className="space-y-4 mt-4">
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Show Local Weather</Label>
                  <Switch
                    checked={settings.showWeather}
                    onCheckedChange={(checked) => updateSetting('showWeather', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Additional Locations (up to 3)</Label>
                  {settings.locations.map((loc, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={loc.name} disabled className="flex-1" />
                      <Input value={loc.timezone} disabled className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLocation(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {settings.locations.length < 3 && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Location name"
                        value={newLocation.name}
                        onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      />
                      <Input
                        placeholder="Timezone"
                        value={newLocation.timezone}
                        onChange={(e) => setNewLocation({ ...newLocation, timezone: e.target.value })}
                      />
                      <Button onClick={addLocation} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Custom Reminders</Label>
                  {settings.customReminders.map((reminder, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={reminder.text} disabled className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeReminder(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a reminder..."
                      value={newReminder}
                      onChange={(e) => setNewReminder(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addReminder()}
                    />
                    <Button onClick={addReminder} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Countdown Timers</Label>
                  {settings.countdowns.map((countdown, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={countdown.name} disabled className="flex-1" />
                      <Input value={format(new Date(countdown.date), 'PPP')} disabled />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCountdown(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2 flex-wrap">
                    <Input
                      placeholder="Event name"
                      value={newCountdown.name}
                      onChange={(e) => setNewCountdown({ ...newCountdown, name: e.target.value })}
                      className="flex-1"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(newCountdown.date, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newCountdown.date}
                          onSelect={(date) => date && setNewCountdown({ ...newCountdown, date })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <Button onClick={addCountdown} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="tools" className="space-y-4 mt-4">
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Pomodoro Timer</Label>
                  <Switch
                    checked={settings.pomodoroEnabled}
                    onCheckedChange={(checked) => updateSetting('pomodoroEnabled', checked)}
                  />
                </div>

                {settings.pomodoroEnabled && (
                  <div className="space-y-4 pl-4 border-l-2">
                    <div className="space-y-2">
                      <Label>Work Duration (minutes)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[settings.pomodoroSettings.workMinutes]}
                          onValueChange={([value]) =>
                            updateSetting('pomodoroSettings', { ...settings.pomodoroSettings, workMinutes: value })
                          }
                          min={1}
                          max={60}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{settings.pomodoroSettings.workMinutes}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Break Duration (minutes)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[settings.pomodoroSettings.breakMinutes]}
                          onValueChange={([value]) =>
                            updateSetting('pomodoroSettings', { ...settings.pomodoroSettings, breakMinutes: value })
                          }
                          min={1}
                          max={30}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{settings.pomodoroSettings.breakMinutes}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Long Break Duration (minutes)</Label>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[settings.pomodoroSettings.longBreakMinutes]}
                          onValueChange={([value]) =>
                            updateSetting('pomodoroSettings', { ...settings.pomodoroSettings, longBreakMinutes: value })
                          }
                          min={5}
                          max={60}
                          step={1}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{settings.pomodoroSettings.longBreakMinutes}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Show Visual Timer</Label>
                      <Switch
                        checked={settings.pomodoroSettings.visualTimer}
                        onCheckedChange={(checked) =>
                          updateSetting('pomodoroSettings', { ...settings.pomodoroSettings, visualTimer: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Timer Color</Label>
                      <Input
                        type="text"
                        placeholder="e.g., #FF5733 or hsl(var(--primary))"
                        value={settings.pomodoroSettings.timerColor}
                        onChange={(e) =>
                          updateSetting('pomodoroSettings', { ...settings.pomodoroSettings, timerColor: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Number Color</Label>
                      <Input
                        type="text"
                        placeholder="e.g., #FFFFFF or hsl(var(--foreground))"
                        value={settings.pomodoroSettings.numberColor}
                        onChange={(e) =>
                          updateSetting('pomodoroSettings', { ...settings.pomodoroSettings, numberColor: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="effects" className="space-y-4 mt-4">
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Celebrate Wins 🎉</Label>
                    <p className="text-xs text-muted-foreground">
                      Confetti explosions when you complete assignments!
                    </p>
                  </div>
                  <Switch
                    checked={settings.celebrateWins}
                    onCheckedChange={(checked) => updateSetting('celebrateWins', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>8-bit Twinkling Stars ✨</Label>
                    <p className="text-xs text-muted-foreground">
                      Pixelated stars in your header
                    </p>
                  </div>
                  <Switch
                    checked={settings.show8BitStars}
                    onCheckedChange={(checked) => updateSetting('show8BitStars', checked)}
                  />
                </div>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onDemo} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Demo Win Celebration
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            onSave(settings);
            onOpenChange(false);
          }}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
