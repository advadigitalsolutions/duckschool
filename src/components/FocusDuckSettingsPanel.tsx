import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface FocusDuckSettingsPanelProps {
  isEducator: boolean;
}

export function FocusDuckSettingsPanel({ isEducator }: FocusDuckSettingsPanelProps) {
  const [defaultDuration, setDefaultDuration] = useState(45);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [idleThreshold, setIdleThreshold] = useState(60);
  const [accountabilityEnabled, setAccountabilityEnabled] = useState(false);
  const [applyPenalties, setApplyPenalties] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('focusDuckSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      setDefaultDuration(settings.defaultDuration || 45);
      setSoundsEnabled(settings.soundsEnabled ?? true);
      setIdleThreshold(settings.idleThreshold || 60);
      setAccountabilityEnabled(settings.accountabilityEnabled || false);
      setApplyPenalties(settings.applyPenalties || false);
    }
  }, []);

  const saveSettings = (updates: any) => {
    const current = JSON.parse(localStorage.getItem('focusDuckSettings') || '{}');
    const newSettings = { ...current, ...updates };
    localStorage.setItem('focusDuckSettings', JSON.stringify(newSettings));
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('focusDuckSettingsChanged', { detail: newSettings }));
  };

  return (
    <Card className="p-6 bg-muted/30 border-muted-foreground/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Focus Duck Settings</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            localStorage.removeItem('focus_duck_wizard_completed');
            window.location.reload();
          }}
        >
          🦆 Replay Tutorial
        </Button>
      </div>
      
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

        <Separator />

        {/* Screenshot Accountability */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="accountability-mode">Screenshot Accountability</Label>
            <div className="text-sm text-muted-foreground">
              Random checks every 30 seconds to 5 minutes
            </div>
          </div>
          <Switch
            id="accountability-mode"
            checked={accountabilityEnabled}
            onCheckedChange={(checked) => {
              setAccountabilityEnabled(checked);
              saveSettings({ accountabilityEnabled: checked });
            }}
          />
        </div>

        {accountabilityEnabled && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="apply-penalties">Apply Penalties</Label>
                <div className="text-sm text-muted-foreground">
                  Lose -1 XP when screenshot doesn't match goal
                </div>
              </div>
              <Switch
                id="apply-penalties"
                checked={applyPenalties}
                onCheckedChange={(checked) => {
                  setApplyPenalties(checked);
                  saveSettings({ applyPenalties: checked });
                }}
              />
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                Privacy Notice
              </p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Checks happen at RANDOM intervals (30s - 5min)</li>
                <li>• You'll be prompted to share your screen</li>
                <li>• AI analyzes if you're on-task</li>
                <li>• Screenshots are immediately deleted (never stored)</li>
                <li>• Click "No" anytime to pause with or without penalty</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
