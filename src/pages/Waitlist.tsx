import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Mail, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import duckGraduation from '@/assets/duck-graduation.png';

export default function Waitlist() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_0_40px_hsl(var(--primary)/0.6)]">
            <img src={duckGraduation} alt="Duck with graduation cap" className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <CardTitle className="text-3xl">You're on the list!</CardTitle>
            </div>
            <CardDescription className="text-lg">
              Welcome to the Masterymode.ai community
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
            <h3 className="text-xl font-semibold text-center">We're in Closed Beta</h3>
            <p className="text-center text-muted-foreground">
              Masterymode.ai is currently in a closed beta phase. We're carefully onboarding users 
              to ensure the best possible experience as we refine our platform.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col items-center text-center p-4 rounded-lg border">
              <Mail className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">Check Your Email</h4>
              <p className="text-sm text-muted-foreground">
                You'll receive an invitation when we're ready to welcome you
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 rounded-lg border">
              <Users className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">Join the Community</h4>
              <p className="text-sm text-muted-foreground">
                Follow our journey as we revolutionize education
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <p className="text-sm text-center text-muted-foreground">
              In the meantime, you can:
            </p>
            <ul className="text-sm space-y-2 text-muted-foreground max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Learn more about our vision for education innovation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Stay updated on our progress and feature releases</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Connect with other educators in our community</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/')}
            >
              Learn More
            </Button>
            <Button 
              className="flex-1"
              onClick={() => navigate('/auth')}
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
