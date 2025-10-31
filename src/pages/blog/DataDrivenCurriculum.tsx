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

              <h2 className="text-2xl font-bold mt-8">The Traditional Approach</h2>
              <p>
                Most homeschool parents choose curriculum the same way: read reviews, ask Facebook groups, buy the pretty workbooks, and hope for the best. Six months later, you discover your child has massive gaps in foundational skills—or is bored because the curriculum is repeating what they already know.
              </p>
              
              <h2 className="text-2xl font-bold mt-8">The Data-Driven Difference</h2>
              <p>
                What if, instead of guessing, you knew exactly:
              </p>
              <ul>
                <li>Which grade-level standards your child has mastered</li>
                <li>Which specific skills they're missing</li>
                <li>What prerequisites they need before tackling new concepts</li>
                <li>Which topics genuinely interest them</li>
                <li>How they learn best (visual, auditory, kinesthetic, etc.)</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">How AI Diagnostics Work</h2>
              <p>
                SmartCore uses adaptive diagnostics that adjust in real-time based on your child's responses. Instead of forcing them through 100 questions they already know, the system quickly identifies:
              </p>
              <ul>
                <li><strong>Zone of Mastery:</strong> Skills they've got locked down</li>
                <li><strong>Zone of Proximal Development:</strong> Skills they're ready to learn next</li>
                <li><strong>Knowledge Gaps:</strong> Missing prerequisites that need filling</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">Beyond One-Time Testing</h2>
              <p>
                Traditional placement tests tell you where your child is on Day 1. SmartCore continuously monitors progress, automatically adjusting the curriculum as they grow. When they master a skill, the system moves them forward. When they struggle, it fills the gaps.
              </p>

              <h2 className="text-2xl font-bold mt-8">Real Results</h2>
              <blockquote className="border-l-4 border-primary pl-4 italic my-6">
                "We spent two years using a popular boxed curriculum that was supposedly 'at grade level.' SmartCore's diagnostic revealed my daughter was actually 2 years ahead in reading but missing critical math fundamentals. We would never have known without data."
                <footer className="text-sm mt-2">— Sarah M., California homeschool parent</footer>
              </blockquote>

              <h2 className="text-2xl font-bold mt-8">Stop Guessing, Start Growing</h2>
              <p>
                The right curriculum isn't about what other families use or what looks good in photos. It's about meeting your child exactly where they are and moving them systematically toward mastery—no gaps, no wasted time, no guesswork.
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
