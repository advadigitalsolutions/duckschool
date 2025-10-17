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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        const {
          data: studentData
        } = await supabase.from('students').select('id').eq('user_id', user.id).single();
        if (studentData) {
          setStudentId(studentData.id);
        }

        // Check if user is educator/parent
        const {
          data: roles
        } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
        if (roles?.some(r => r.role === 'parent' || r.role === 'admin')) {
          setIsEducator(true);
        }
      }
    };
    init();
  }, []);
  const handlePopOut = () => {
    const url = activeTab === 'pomodoro' ? '/pomodoro-popup' : `/duck-popup?studentId=${studentId}`;
    const features = 'width=400,height=500,resizable=yes,location=no,menubar=no,toolbar=no,status=no';
    window.open(url, 'focusTimer', features);
  };
  return <div className="min-h-screen relative overflow-hidden">
      {/* Animated Rippling Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(190,70%,15%)] via-[hsl(270,60%,20%)] to-[hsl(190,70%,15%)]">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(180,80%,40%)] rounded-full mix-blend-screen filter blur-3xl animate-[ripple_8s_ease-in-out_infinite]" />
          <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-[hsl(270,70%,50%)] rounded-full mix-blend-screen filter blur-3xl animate-[ripple_10s_ease-in-out_infinite_2s]" />
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-[hsl(190,75%,45%)] rounded-full mix-blend-screen filter blur-3xl animate-[ripple_12s_ease-in-out_infinite_4s]" />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-4 max-w-5xl relative z-10">
        {/* Header */}
        <div className="mb-4 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
            Focus Tools
          </h1>
          <p className="text-gray-300 text-lg">
            Choose your focus mode and customize it to work best for you
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-2 shadow-2xl overflow-hidden bg-black/40 backdrop-blur-sm border-cyan-500/20">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'pomodoro' | 'duck')} className="w-full">
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
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="gap-2">
                <Settings2 className={`h-4 w-4 ${showSettings ? 'animate-spin' : ''}`} />
                {showSettings ? 'Hide' : 'Show'} Settings
              </Button>
              
              <Button variant="outline" size="sm" onClick={handlePopOut} className="gap-2">
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
        
      </div>
    </div>;
}