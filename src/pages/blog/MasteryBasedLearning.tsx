import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';
import studentHeadphones from '@/assets/blog/student-learning-headphones.jpg';

export default function MasteryBasedLearning() {
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
                <Badge variant="secondary">Educational Research</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  January 10, 2025
                </span>
                <span className="text-sm text-muted-foreground">• 10 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                The Science Behind Mastery-Based Learning: Why It Works Better Than Traditional Education
              </h1>
            </div>
            <img 
              src={studentHeadphones} 
              alt="Student engaged in personalized mastery-based learning" 
              className="w-full h-[400px] object-cover rounded-lg"
            />
            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                Research shows mastery-based learning produces better outcomes than time-based education. Here's the neuroscience and data that proves it—and how Duckschool implements it.
              </p>
              <div className="border-t pt-8 mt-12">
                <Button size="lg" className="mt-4" onClick={() => navigate('/auth')}>
                  Try Mastery-Based Learning
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
