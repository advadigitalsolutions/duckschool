import { useState, useEffect } from 'react';
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
import { CalendarIcon, Plus, Trash2, Sparkles, Palette, Clock, Save, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Madrid', label: 'Barcelona/Madrid (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
];

interface HeaderSettings {
  showName: boolean;
  customName: string | null;
  showGrade: boolean;
  customGrade: string | null;
  greetingType: 'none' | 'name' | 'time-based';
  rotatingDisplay: 'none' | 'quote' | 'affirmation' | 'funFact';
  rotationFrequency: 'minute' | 'hour' | 'day';
  funFactTopic: string | null;
  locations: Array<{ name: string; timezone: string }>;
  showWeather: boolean;
  weatherZipCode: string | null;
  customReminders: Array<{ text: string; completed: boolean }>;
  countdowns: Array<{ 
    name: string; 
    date: Date; 
    time?: string;
    showDays: boolean;
    showHours: boolean;
    showMinutes: boolean;
    showSeconds: boolean;
    isComplete?: boolean;
  }>;
  pomodoroEnabled: boolean;
  pomodoroSettings: {
    workMinutes: number;
    breakMinutes: number;
    longBreakMinutes: number;
    sessionsUntilLongBreak: number;
    visualTimer: boolean;
    showTimeText: boolean;
    timerColor: string;
    numberColor: string;
    showMinutesInside: boolean;
    timerStyle: 'doughnut' | 'traditional';
    soundEffect: 'beep' | 'chime' | 'bell' | 'gong' | 'airhorn' | 'duck' | 'none';
  };
  celebrateWins: boolean;
  show8BitStars: boolean;
  starColor: string;
  showClouds: boolean;
  cloudColor: string;
  headerVisibility: 'sticky' | 'auto-hide' | 'normal';
}

interface HeaderCustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: HeaderSettings;
  onSave: (settings: HeaderSettings) => void;
  onDemo: () => void;
  studentName: string;
  initialTab?: string;
}

export function HeaderCustomizationModal({
  open,
  onOpenChange,
  settings: initialSettings,
  onSave,
  onDemo,
  studentName,
  initialTab = 'display',
}: HeaderCustomizationModalProps) {
  const [settings, setSettings] = useState<HeaderSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [newLocation, setNewLocation] = useState({ name: '', timezone: '' });
  const [newReminder, setNewReminder] = useState('');
  const [newCountdown, setNewCountdown] = useState({ 
    name: '', 
    date: new Date(), 
    time: '',
    showDays: true,
    showHours: true,
    showMinutes: true,
    showSeconds: true
  });
  const [showColorPicker, setShowColorPicker] = useState<'stars' | 'clouds' | 'timer' | 'number' | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavedTooltip, setShowSavedTooltip] = useState(false);

  // Sync settings when initialSettings change
  useEffect(() => {
    setSettings(initialSettings);
    setHasUnsavedChanges(false);
  }, [initialSettings, open]);

  // Sync active tab when modal opens with initialTab
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const updateSetting = <K extends keyof HeaderSettings>(key: K, value: HeaderSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
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
      setNewCountdown({ 
        name: '', 
        date: new Date(), 
        time: '',
        showDays: true,
        showHours: true,
        showMinutes: true,
        showSeconds: true
      });
    }
  };

  const removeCountdown = (index: number) => {
    updateSetting('countdowns', settings.countdowns.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(settings);
    setHasUnsavedChanges(false);
    setShowSavedTooltip(true);
    setTimeout(() => setShowSavedTooltip(false), 1000);
  };

  const handleSaveAndClose = () => {
    onSave(settings);
    setHasUnsavedChanges(false);
    onOpenChange(false);
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="rotating">Subtext</TabsTrigger>
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
                      <SelectItem value="none">None (no greeting)</SelectItem>
                      <SelectItem value="name">Welcome back, [Name]</SelectItem>
                      <SelectItem value="time-based">Good [morning/afternoon/evening], [Name]</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Card className="p-4 space-y-4 border-2 border-primary/50 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">Quick Task Reminders</Label>
                    <p className="text-xs text-muted-foreground">Add tasks to display in your header</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {settings.customReminders.map((reminder, index) => (
                    <div key={index} className="flex items-center gap-2 bg-background/50 p-2 rounded-md">
                      <Input value={reminder.text} disabled className="flex-1 border-0 bg-transparent" />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeReminder(index)}
                        className="hover:bg-destructive/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Add a task reminder..."
                      value={newReminder}
                      onChange={(e) => setNewReminder(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addReminder()}
                      className="flex-1"
                    />
                    <Button onClick={addReminder} size="icon" className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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

                {settings.rotatingDisplay !== 'none' && (
                  <div className="space-y-2">
                    <Label>Rotation Frequency</Label>
                    <Select
                      value={settings.rotationFrequency}
                      onValueChange={(value: any) => updateSetting('rotationFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minute">Every Minute</SelectItem>
                        <SelectItem value="hour">Every Hour</SelectItem>
                        <SelectItem value="day">Once Per Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {settings.rotatingDisplay === 'funFact' && (
                  <div className="space-y-2">
                    <Label>Fun Facts Topic</Label>
                    <Input
                      placeholder="e.g., Space, Dinosaurs, Ocean Animals"
                      value={settings.funFactTopic || ''}
                      onChange={(e) => updateSetting('funFactTopic', e.target.value || null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      AI will generate fun facts about this topic
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="info" className="space-y-4 mt-4">
              <Card className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Show Local Weather</Label>
                    <Switch
                      checked={settings.showWeather}
                      onCheckedChange={(checked) => updateSetting('showWeather', checked)}
                    />
                  </div>
                  {settings.showWeather && (
                    <Input
                      placeholder="ZIP / Postal Code (optional, uses browser location if empty)"
                      value={settings.weatherZipCode || ''}
                      onChange={(e) => updateSetting('weatherZipCode', e.target.value || null)}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Additional Time Zones (up to 3)</Label>
                  {settings.locations.map((loc, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={loc.name} disabled className="flex-1" />
                      <Input value={TIMEZONES.find(tz => tz.value === loc.timezone)?.label || loc.timezone} disabled className="flex-1" />
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
                        className="flex-1"
                      />
                      <Select
                        value={newLocation.timezone}
                        onValueChange={(value) => setNewLocation({ ...newLocation, timezone: value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={addLocation} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Countdown Timers</Label>
                  {settings.countdowns.map((countdown, index) => (
                    <div key={index} className="flex items-center gap-2 flex-wrap">
                      <Input value={countdown.name} disabled className="flex-1 min-w-[150px]" />
                      <Input 
                        value={`${format(new Date(countdown.date), 'PPP')}${countdown.time ? ` ${countdown.time}` : ''}`} 
                        disabled 
                        className="flex-1 min-w-[200px]"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCountdown(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Input
                        placeholder="Event name"
                        value={newCountdown.name}
                        onChange={(e) => setNewCountdown({ ...newCountdown, name: e.target.value })}
                        className="flex-1 min-w-[150px]"
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline">
                            <Clock className="mr-2 h-4 w-4" />
                            {newCountdown.time || 'Time'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                          <Input
                            type="time"
                            value={newCountdown.time}
                            onChange={(e) => setNewCountdown({ ...newCountdown, time: e.target.value })}
                          />
                        </PopoverContent>
                      </Popover>
                      <Button onClick={addCountdown} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <Label className="flex items-center gap-2">
                        <Switch
                          checked={newCountdown.showDays}
                          onCheckedChange={(checked) => setNewCountdown({ ...newCountdown, showDays: checked })}
                        />
                        Days
                      </Label>
                      <Label className="flex items-center gap-2">
                        <Switch
                          checked={newCountdown.showHours}
                          onCheckedChange={(checked) => setNewCountdown({ ...newCountdown, showHours: checked })}
                        />
                        Hours
                      </Label>
                      <Label className="flex items-center gap-2">
                        <Switch
                          checked={newCountdown.showMinutes}
                          onCheckedChange={(checked) => setNewCountdown({ ...newCountdown, showMinutes: checked })}
                        />
                        Minutes
                      </Label>
                      <Label className="flex items-center gap-2">
                        <Switch
                          checked={newCountdown.showSeconds}
                          onCheckedChange={(checked) => setNewCountdown({ ...newCountdown, showSeconds: checked })}
                        />
                        Seconds
                      </Label>
                    </div>
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

                    <div className="flex items-center justify-between">
                      <Label>Show Time Text</Label>
                      <Switch
                        checked={settings.pomodoroSettings.showTimeText ?? true}
                        onCheckedChange={(checked) =>
                          updateSetting('pomodoroSettings', { ...settings.pomodoroSettings, showTimeText: checked })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground -mt-2">
                      You can enable visual timer, time text, or both
                    </p>

                    {settings.pomodoroSettings.visualTimer && (
                      <>
                        <div className="space-y-2">
                          <Label>Timer Style</Label>
                          <Select
                            value={settings.pomodoroSettings.timerStyle || 'doughnut'}
                            onValueChange={(value: 'doughnut' | 'traditional') =>
                              updateSetting('pomodoroSettings', { ...settings.pomodoroSettings, timerStyle: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="doughnut">Doughnut (Ring)</SelectItem>
                              <SelectItem value="traditional">Traditional (Pie Chart)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Choose between a ring-style or classic pie-chart timer
                          </p>
                        </div>

                        {settings.pomodoroSettings.timerStyle === 'doughnut' && (
                          <div className="flex items-center justify-between">
                            <Label>Show Minutes Inside Timer</Label>
                            <Switch
                              checked={settings.pomodoroSettings.showMinutesInside ?? true}
                              onCheckedChange={(checked) =>
                                updateSetting('pomodoroSettings', { ...settings.pomodoroSettings, showMinutesInside: checked })
                              }
                            />
                          </div>
                        )}
                      </>
                    )}

                    <div className="space-y-2">
                      <Label>Timer Color</Label>
                      <Input
                        type="color"
                        value={settings.pomodoroSettings.timerColor.startsWith('#') ? settings.pomodoroSettings.timerColor : '#3b82f6'}
                        onChange={(e) =>
                          updateSetting('pomodoroSettings', { ...settings.pomodoroSettings, timerColor: e.target.value })
                        }
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Number Color</Label>
                      <Input
                        type="color"
                        value={settings.pomodoroSettings.numberColor.startsWith('#') ? settings.pomodoroSettings.numberColor : '#ffffff'}
                        onChange={(e) =>
                          updateSetting('pomodoroSettings', { ...settings.pomodoroSettings, numberColor: e.target.value })
                        }
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Completion Sound</Label>
                      <Select
                        value={settings.pomodoroSettings.soundEffect || 'beep'}
                        onValueChange={(value: any) =>
                          updateSetting('pomodoroSettings', { ...settings.pomodoroSettings, soundEffect: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beep">🔔 Beep (Subtle)</SelectItem>
                          <SelectItem value="chime">🎵 Chime (Pleasant)</SelectItem>
                          <SelectItem value="bell">🔔 Bell (Classic)</SelectItem>
                          <SelectItem value="gong">⚡ Gong (Dramatic)</SelectItem>
                          <SelectItem value="airhorn">📢 Airhorn (Loud!)</SelectItem>
                          <SelectItem value="duck">🦆 Duck Quack (Funny)</SelectItem>
                          <SelectItem value="none">🔇 None (Silent)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Sound that plays when timer completes
                      </p>
                    </div>

                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          window.open('/pomodoro-fullscreen', '_blank', 'width=1200,height=800');
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5v4m0-4h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                        </svg>
                        Open Fullscreen Timer
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Opens timer in new window with fullscreen mode
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="effects" className="space-y-4 mt-4">
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label>Celebrate Wins</Label>
                    <p className="text-xs text-muted-foreground">Show celebration effects</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onDemo}
                    >
                      Demo
                    </Button>
                    <Switch
                      checked={settings.celebrateWins}
                      onCheckedChange={(checked) => updateSetting('celebrateWins', checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label>8-bit Twinkling Stars</Label>
                    <p className="text-xs text-muted-foreground">Decorative stars in header</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Palette className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <div className="space-y-2">
                          <Label>Star Color</Label>
                          <input
                            type="color"
                            value={settings.starColor}
                            onChange={(e) => updateSetting('starColor', e.target.value)}
                            className="h-10 w-full cursor-pointer rounded border"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Switch
                      checked={settings.show8BitStars}
                      onCheckedChange={(checked) => updateSetting('show8BitStars', checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label>Night Sky Clouds</Label>
                    <p className="text-xs text-muted-foreground">Wispy clouds drifting over background</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Palette className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <div className="space-y-2">
                          <Label>Cloud Color (with transparency)</Label>
                          <input
                            type="color"
                            value={settings.cloudColor?.startsWith('rgba') ? '#ffffff' : settings.cloudColor || '#ffffff'}
                            onChange={(e) => {
                              const hex = e.target.value;
                              const r = parseInt(hex.slice(1, 3), 16);
                              const g = parseInt(hex.slice(3, 5), 16);
                              const b = parseInt(hex.slice(5, 7), 16);
                              updateSetting('cloudColor', `rgba(${r}, ${g}, ${b}, 0.15)`);
                            }}
                            className="h-10 w-full cursor-pointer rounded border"
                          />
                          <p className="text-xs text-muted-foreground">
                            Transparency is automatically applied
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Switch
                      checked={settings.showClouds}
                      onCheckedChange={(checked) => updateSetting('showClouds', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Header Visibility</Label>
                  <Select
                    value={settings.headerVisibility}
                    onValueChange={(value: any) => updateSetting('headerVisibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sticky">Always Visible (Sticky)</SelectItem>
                      <SelectItem value="auto-hide">Auto-Hide on Scroll</SelectItem>
                      <SelectItem value="normal">Normal (Not Sticky)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Control how the header behaves when scrolling
                  </p>
                </div>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <div className="flex-1" />
          <Popover open={showSavedTooltip}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className={cn(
                  "transition-all",
                  hasUnsavedChanges && "text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Save className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 text-sm">
              Saved!
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveAndClose}>
            <Save className="mr-2 h-4 w-4" />
            Save & Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
