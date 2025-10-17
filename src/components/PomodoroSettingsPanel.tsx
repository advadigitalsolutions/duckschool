import { usePomodoro } from '@/contexts/PomodoroContext';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PomodoroSettingsPanel() {
  const { settings, updateSettings } = usePomodoro();

  return (
    <Card className="p-6 bg-muted/30 border-muted-foreground/20">
      <h3 className="text-lg font-semibold mb-4">Timer Settings</h3>
      
      <div className="space-y-6">
        {/* Focus Duration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Focus Duration</Label>
            <span className="text-sm font-mono text-muted-foreground">
              {settings.workMinutes} minutes
            </span>
          </div>
          <Slider
            value={[settings.workMinutes]}
            onValueChange={([value]) => updateSettings({ ...settings, workMinutes: value })}
            min={5}
            max={60}
            step={5}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Short Break */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Short Break</Label>
            <span className="text-sm font-mono text-muted-foreground">
              {settings.breakMinutes} minutes
            </span>
          </div>
          <Slider
            value={[settings.breakMinutes]}
            onValueChange={([value]) => updateSettings({ ...settings, breakMinutes: value })}
            min={3}
            max={15}
            step={1}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Long Break */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Long Break</Label>
            <span className="text-sm font-mono text-muted-foreground">
              {settings.longBreakMinutes} minutes
            </span>
          </div>
          <Slider
            value={[settings.longBreakMinutes]}
            onValueChange={([value]) => updateSettings({ ...settings, longBreakMinutes: value })}
            min={10}
            max={30}
            step={5}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Sessions Until Long Break */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Sessions Until Long Break</Label>
            <span className="text-sm font-mono text-muted-foreground">
              {settings.sessionsUntilLongBreak}
            </span>
          </div>
          <Slider
            value={[settings.sessionsUntilLongBreak]}
            onValueChange={([value]) => updateSettings({ ...settings, sessionsUntilLongBreak: value })}
            min={2}
            max={8}
            step={1}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Sound Effect */}
        <div className="space-y-3">
          <Label>Timer Completion Sound</Label>
          <Select
            value={settings.soundEffect}
            onValueChange={(value) => updateSettings({ ...settings, soundEffect: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="chime">Chime</SelectItem>
              <SelectItem value="beep">Beep</SelectItem>
              <SelectItem value="bell">Bell</SelectItem>
              <SelectItem value="gong">Gong</SelectItem>
              <SelectItem value="airhorn">Airhorn</SelectItem>
              <SelectItem value="duck">Duck</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Visual Settings */}
        <div className="space-y-4">
          <Label className="text-base">Display Options</Label>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="visual-timer" className="font-normal">Show Visual Timer</Label>
            <Switch
              id="visual-timer"
              checked={settings.visualTimer}
              onCheckedChange={(checked) => updateSettings({ ...settings, visualTimer: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="time-text" className="font-normal">Show Time Text</Label>
            <Switch
              id="time-text"
              checked={settings.showTimeText}
              onCheckedChange={(checked) => updateSettings({ ...settings, showTimeText: checked })}
            />
          </div>

          {settings.visualTimer && (
            <div className="space-y-3 pl-4 border-l-2 border-muted">
              <Label>Timer Style</Label>
              <Select
                value={settings.timerStyle}
                onValueChange={(value) => updateSettings({ ...settings, timerStyle: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doughnut">Doughnut</SelectItem>
                  <SelectItem value="traditional">Traditional (Clock)</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between">
                <Label htmlFor="minutes-inside" className="font-normal text-sm">Show Minutes Inside Timer</Label>
                <Switch
                  id="minutes-inside"
                  checked={settings.showMinutesInside}
                  onCheckedChange={(checked) => updateSettings({ ...settings, showMinutesInside: checked })}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
