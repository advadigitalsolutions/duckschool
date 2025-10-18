import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  User, 
  Palette, 
  Accessibility, 
  GraduationCap, 
  Bell, 
  CreditCard, 
  HelpCircle, 
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const settingsNavigation = [
  { name: 'Account', href: '/settings/account', icon: User },
  { name: 'Appearance', href: '/settings/appearance', icon: Palette },
  { name: 'Accessibility', href: '/settings/accessibility', icon: Accessibility },
  { name: 'Learning Profile', href: '/settings/learning-profile', icon: GraduationCap },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Billing', href: '/settings/billing', icon: CreditCard },
  { name: 'Help & Support', href: '/settings/help', icon: HelpCircle },
  { name: 'Feedback', href: '/settings/feedback', icon: MessageSquare },
];

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to account settings by default
  useEffect(() => {
    if (location.pathname === '/settings' || location.pathname === '/settings/') {
      navigate('/settings/account', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>
        <Separator />
        <nav className="flex-1 p-4 space-y-1">
          {settingsNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
                <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 md:p-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}