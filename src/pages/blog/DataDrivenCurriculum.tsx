import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';
import parentLearning from '@/assets/blog/parent-child-learning.jpg';

export default function DataDrivenCurriculum() {
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
                <Badge variant="secondary">Curriculum Planning</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  January 15, 2025
                </span>
                <span className="text-sm text-muted-foreground">• 9 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                How to Choose the Right Homeschool Curriculum: A Data-Driven Approach
              </h1>
            </div>
            <img 
              src={parentLearning} 
              alt="Parent helping child with homeschool curriculum planning" 
              className="w-full h-[400px] object-cover rounded-lg"
            />
            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                Stop guessing and start knowing: AI-powered diagnostics reveal exactly where your child is, what they need, and how to get them there.
              </p>
              <div className="border-t pt-8 mt-12">
                <Button size="lg" className="mt-4" onClick={() => navigate('/auth')}>
                  Get Your Diagnostic Assessment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
