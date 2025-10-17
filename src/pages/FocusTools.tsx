import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timer, Flame, Settings2, Maximize2, Pin, PinOff } from 'lucide-react';
import { SimplePomodoroTimer } from '@/components/SimplePomodoroTimer';
import { FocusDuckSession } from '@/components/FocusDuckSession';
import { PomodoroSettingsPanel } from '@/components/PomodoroSettingsPanel';
import { FocusDuckSettingsPanel } from '@/components/FocusDuckSettingsPanel';
import { supabase } from '@/integrations/supabase/client';

export default function FocusTools() {
  const [activeTab, setActiveTab] = useState<'pomodoro' | 'duck'>('pomodoro');
  const [showSettings, setShowSettings] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isEducator, setIsEducator] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (studentData) {
          setStudentId(studentData.id);
        }

        // Check if user is educator/parent
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        if (roles?.some(r => r.role === 'parent' || r.role === 'admin')) {
          setIsEducator(true);
        }
      }
    };

    init();
  }, []);

  const handlePopOut = () => {
    const url = activeTab === 'pomodoro' 
      ? '/pomodoro-popup' 
      : `/duck-popup?studentId=${studentId}`;
    
    const features = 'width=400,height=500,resizable=yes,alwaysRaised=yes';
    window.open(url, 'focusTimer', features);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Focus Tools
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose your focus mode and customize it to work best for you
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-2 shadow-2xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pomodoro' | 'duck')} className="w-full">
            {/* Tab Navigation */}
            <div className="border-b bg-muted/30 px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2 h-14 mb-4">
                <TabsTrigger value="pomodoro" className="text-base gap-2">
                  <Timer className="h-5 w-5" />
                  Pomodoro Timer
                </TabsTrigger>
                <TabsTrigger value="duck" className="text-base gap-2">
                  <Flame className="h-5 w-5" />
                  Focus Duck
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Actions Bar */}
            <div className="border-b bg-muted/20 px-6 py-3 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="gap-2"
              >
                <Settings2 className={`h-4 w-4 ${showSettings ? 'animate-spin' : ''}`} />
                {showSettings ? 'Hide' : 'Show'} Settings
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handlePopOut}
                className="gap-2"
              >
                <Maximize2 className="h-4 w-4" />
                Pop Out Window
              </Button>
            </div>

            {/* Content */}
            <div className="p-8">
              <TabsContent value="pomodoro" className="mt-0 space-y-6">
                {showSettings && <PomodoroSettingsPanel />}
                <SimplePomodoroTimer studentId={studentId} />
              </TabsContent>

              <TabsContent value="duck" className="mt-0 space-y-6">
                {showSettings && <FocusDuckSettingsPanel isEducator={isEducator} />}
                <FocusDuckSession studentId={studentId} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Quick Tips */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="p-6 bg-primary/5 border-primary/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              Pomodoro Timer
            </h3>
            <p className="text-sm text-muted-foreground">
              Work in focused 25-minute intervals with regular breaks. Perfect for structured study sessions.
            </p>
          </Card>

          <Card className="p-6 bg-accent/5 border-accent/20">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Flame className="h-5 w-5 text-accent" />
              Focus Duck
            </h3>
            <p className="text-sm text-muted-foreground">
              Your friendly companion that keeps you on track. Set a goal and watch it climb as you focus!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
