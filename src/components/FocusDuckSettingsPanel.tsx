import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface FocusDuckSettingsPanelProps {
  isEducator: boolean;
}

export function FocusDuckSettingsPanel({ isEducator }: FocusDuckSettingsPanelProps) {
  const [defaultDuration, setDefaultDuration] = useState(45);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [idleThreshold, setIdleThreshold] = useState(60);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('focusDuckSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      setDefaultDuration(settings.defaultDuration || 45);
      setSoundsEnabled(settings.soundsEnabled ?? true);
      setIdleThreshold(settings.idleThreshold || 60);
    }
  }, []);

  const saveSettings = (updates: any) => {
    const current = JSON.parse(localStorage.getItem('focusDuckSettings') || '{}');
    const newSettings = { ...current, ...updates };
    localStorage.setItem('focusDuckSettings', JSON.stringify(newSettings));
  };

  return (
    <Card className="p-6 bg-muted/30 border-muted-foreground/20">
      <h3 className="text-lg font-semibold mb-4">Focus Duck Settings</h3>
      
      <div className="space-y-6">
        {/* Default Duration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Default Session Duration</Label>
            <span className="text-sm font-mono text-muted-foreground">
              {defaultDuration} minutes
            </span>
          </div>
          <Slider
            value={[defaultDuration]}
            onValueChange={([value]) => {
              setDefaultDuration(value);
              saveSettings({ defaultDuration: value });
            }}
            min={15}
            max={120}
            step={5}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Sound Settings */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="duck-sounds">Duck Sound Effects</Label>
            <div className="text-sm text-muted-foreground">
              Enable quacking, climbing, and celebration sounds
            </div>
          </div>
          <Switch
            id="duck-sounds"
            checked={soundsEnabled}
            onCheckedChange={(checked) => {
              setSoundsEnabled(checked);
              saveSettings({ soundsEnabled: checked });
            }}
          />
        </div>

        {isEducator && (
          <>
            <Separator />

            {/* Idle Threshold (Educator Only) */}
            <div className="space-y-3 opacity-90">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Idle Detection Threshold</Label>
                  <div className="text-xs text-muted-foreground">
                    Seconds before marking student as idle (educator only)
                  </div>
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {idleThreshold}s
                </span>
              </div>
              <Slider
                value={[idleThreshold]}
                onValueChange={([value]) => {
                  setIdleThreshold(value);
                  saveSettings({ idleThreshold: value });
                }}
                min={30}
                max={180}
                step={10}
                className="w-full"
              />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
