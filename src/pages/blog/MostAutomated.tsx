import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';
import busyFamily from '@/assets/blog/busy-family.jpg';

export default function MostAutomated() {
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
                <Badge variant="secondary">Technology</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  December 25, 2024
                </span>
                <span className="text-sm text-muted-foreground">• 6 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                The Most Automated Homeschool Platform in Existence: What AI Can (and Can't) Replace
              </h1>
            </div>
            <img 
              src={busyFamily} 
              alt="Parent working on laptop while managing multiple children at home - illustrating the need for automation in homeschooling" 
              className="w-full h-[400px] object-cover rounded-lg"
            />
            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                Curriculum generation, grading, scheduling, standards tracking, progress monitoring—all automated. But the human connection? That's still yours.
              </p>
              <div className="border-t pt-8 mt-12">
                <Button size="lg" className="mt-4" onClick={() => navigate('/auth')}>
                  See the Automation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
