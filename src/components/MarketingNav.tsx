import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SmartCoreLogo } from './SmartCoreLogo';

export function MarketingNav() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Features', path: '/#features' },
    { label: 'Our Approach', path: '/about' },
    { label: 'About Us', path: '/about-us' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Blog', path: '/blog' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <SmartCoreLogo className="h-10 w-10" />
          <span className="text-xl font-bold">SmartCore Education</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                if (item.path.startsWith('/#')) {
                  navigate('/');
                  setTimeout(() => {
                    const element = document.querySelector(item.path.substring(1));
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  navigate(item.path);
                }
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ))}
          <ThemeToggle />
          <Button variant="ghost" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
          <Button onClick={() => navigate('/auth')}>
            Get Started
          </Button>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setIsOpen(false);
                      if (item.path.startsWith('/#')) {
                        navigate('/');
                        setTimeout(() => {
                          const element = document.querySelector(item.path.substring(1));
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      } else {
                        navigate(item.path);
                      }
                    }}
                    className="text-left text-lg font-medium hover:text-primary transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <Button variant="ghost" className="w-full" onClick={() => {
                    setIsOpen(false);
                    navigate('/auth');
                  }}>
                    Sign In
                  </Button>
                  <Button className="w-full" onClick={() => {
                    setIsOpen(false);
                    navigate('/auth');
                  }}>
                    Get Started
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}