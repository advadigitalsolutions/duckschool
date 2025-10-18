import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export function ContactSupportButton() {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Support Request');
    const body = encodeURIComponent(`Hi ADVA Team,\n\nI need help with:\n\n[Describe your issue here]\n\n---\nUser: ${userEmail}\nPage: ${window.location.href}`);
    window.location.href = `mailto:support@advadigitalsolutions.com?subject=${subject}&body=${body}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleContactSupport}
            className="fixed bottom-6 left-24 z-[9999] h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-all duration-200 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            aria-label="Contact Support"
          >
            <Mail className="h-6 w-6 text-white" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Contact Support 📧</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
