import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';
import modernReportCard from '@/assets/blog/modern-report-card.jpg';

export default function PublicSchoolSupplement() {
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
                <Badge variant="secondary">Hybrid Learning</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  December 18, 2024
                </span>
                <span className="text-sm text-muted-foreground">• 6 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Supplementing Public School: Enrichment, Intervention, and Summer Learning That Actually Works
              </h1>
            </div>
            <img 
              src={modernReportCard} 
              alt="Modern standards-based report card showing detailed skill assessments - illustrating contemporary education tracking" 
              className="w-full h-[400px] object-cover rounded-lg"
            />
            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                Your child attends public school but needs extra support or challenge? Duckschool fills gaps and extends learning without overwhelming schedules.
              </p>
              <div className="border-t pt-8 mt-12">
                <Button size="lg" className="mt-4" onClick={() => navigate('/auth')}>
                  Supplement Smart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
