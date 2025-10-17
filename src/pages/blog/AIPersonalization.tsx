import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';
import homeschoolParent from '@/assets/blog/homeschool-parent-laptop.jpg';

export default function AIPersonalization() {
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
                <Badge variant="secondary">Future of Education</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  January 1, 2025
                </span>
                <span className="text-sm text-muted-foreground">• 9 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                The Future of Homeschooling: AI-Powered Personalization at Scale
              </h1>
            </div>
            <img 
              src={homeschoolParent} 
              alt="Parent using technology for homeschool planning" 
              className="w-full h-[400px] object-cover rounded-lg"
            />
            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                What if every child had a world-class tutor available 24/7? AI makes truly personalized education possible for the first time in human history.
              </p>
              <div className="border-t pt-8 mt-12">
                <Button size="lg" className="mt-4" onClick={() => navigate('/auth')}>
                  Experience AI Personalization
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
