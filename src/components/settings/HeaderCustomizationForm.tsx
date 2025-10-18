import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeaderCustomizationForm() {
  const { theme, setTheme } = useTheme();
  const [headerSettings, setHeaderSettings] = useState({
    showName: true,
    showGrade: true,
    greetingType: 'name' as 'none' | 'name' | 'time-based',
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>Choose your preferred color scheme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Sun className="h-6 w-6" />
              <span>Light</span>
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Moon className="h-6 w-6" />
              <span>Dark</span>
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Monitor className="h-6 w-6" />
              <span>System</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Header Display</CardTitle>
          <CardDescription>Customize what appears in your dashboard header</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Show Name</Label>
            <Switch
              checked={headerSettings.showName}
              onCheckedChange={(checked) => 
                setHeaderSettings(prev => ({ ...prev, showName: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show Grade</Label>
            <Switch
              checked={headerSettings.showGrade}
              onCheckedChange={(checked) => 
                setHeaderSettings(prev => ({ ...prev, showGrade: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Greeting Style</Label>
            <Select
              value={headerSettings.greetingType}
              onValueChange={(value: any) => 
                setHeaderSettings(prev => ({ ...prev, greetingType: value }))
              }
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

          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              For advanced header customization (countdowns, clocks, reminders), click the settings icon in your dashboard header.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
