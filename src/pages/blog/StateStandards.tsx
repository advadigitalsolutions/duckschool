import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';
import vintageReportCard from '@/assets/blog/vintage-report-card.jpg';

export default function StateStandards() {
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
                <Badge variant="secondary">Standards</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  December 20, 2024
                </span>
                <span className="text-sm text-muted-foreground">• 8 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                From California to Coast-to-Coast: How We're Bringing Standards-Aligned AI to All 50 States
              </h1>
            </div>
            <img 
              src={vintageReportCard} 
              alt="Vintage 1970 school report card showing traditional letter grades - illustrating the evolution of educational standards" 
              className="w-full h-[400px] object-cover rounded-lg"
            />
            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                We started with California Common Core. Now we support Texas TEKS, Florida BEST, and standards from every US state—with full alignment tracking.
              </p>
              <div className="border-t pt-8 mt-12">
                <Button size="lg" className="mt-4" onClick={() => navigate('/auth')}>
                  Find Your State Standards
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
