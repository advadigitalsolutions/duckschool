import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';
import childrenPlaying from '@/assets/blog/children-playing-bubbles.jpg';

export default function RigorAndWellBeing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <article className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            <Button variant="ghost" className="mb-4" onClick={() => navigate('/blog')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Holistic Education</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  December 30, 2024
                </span>
                <span className="text-sm text-muted-foreground">• 8 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Balancing Rigor and Well-Being: Academic Excellence Without the Burnout
              </h1>
            </div>
            <img 
              src={childrenPlaying} 
              alt="Children enjoying outdoor play and learning balance" 
              className="w-full h-[400px] object-cover rounded-lg"
            />
            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                High standards don't mean high stress. Learn how pacing algorithms, mental health check-ins, and flexible scheduling keep learning rigorous but sustainable.
              </p>
              <div className="border-t pt-8 mt-12">
                <Button size="lg" className="mt-4" onClick={() => navigate('/auth')}>
                  Find Your Balance
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
