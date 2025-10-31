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
                Not replacing school—enhancing it. SmartCore fills the gaps with enrichment, intervention, and summer learning that keeps kids on track.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Reality of Modern Public Education</h2>
              <p>
                Public school teachers are doing heroic work with impossible constraints: 30+ students per class, limited time, standardized curriculum pacing, and pressure to teach to state tests. Even the best teachers can't give every child the individualized attention they need.
              </p>
              <p>
                The result? High-achievers get bored waiting for the class to catch up. Struggling students fall behind as the class moves forward. And everyone in the middle gets an "okay" education—not terrible, but not optimized for their potential.
              </p>

              <h2 className="text-2xl font-bold mt-8">Three Ways Families Use SmartCore as a Supplement</h2>

              <h3 className="text-xl font-bold mt-6">1. Enrichment for Advanced Learners</h3>
              <p>
                Your fourth-grader is crushing school math but the district won't move them to fifth-grade content. Instead of being bored for a year, use SmartCore to:
              </p>
              <ul className="space-y-2">
                <li>Challenge them with advanced material at their actual level</li>
                <li>Explore deeper mathematical reasoning, not just faster computation</li>
                <li>Dive into passion projects that align with standards (robotics, coding, advanced writing)</li>
                <li>Keep the love of learning alive instead of teaching them to tune out</li>
              </ul>
              <p>
                <strong>Real example:</strong> "My daughter's third-grade teacher said she was 'doing fine.' But she was reading at a seventh-grade level and finishing assignments in 10 minutes. SmartCore gave her challenging work that actually engaged her brain. Now she's excited about learning again."
              </p>

              <h3 className="text-xl font-bold mt-6">2. Intervention for Struggling Students</h3>
              <p>
                Your child is falling behind in reading or math. The school says they "don't qualify for intervention services" because they're not failing—just stuck. Or maybe they do qualify, but the intervention is once a week for 20 minutes in a group of six kids.
              </p>
              <p>
                SmartCore provides:
              </p>
              <ul className="space-y-2">
                <li>Daily diagnostic assessments that pinpoint exact knowledge gaps</li>
                <li>Targeted remediation that fills those specific gaps</li>
                <li>Mastery-based pacing—they don't move forward until concepts stick</li>
                <li>Multi-sensory instruction (visual, auditory, kinesthetic) to reach different learning styles</li>
                <li>Confidence-building through visible progress tracking</li>
              </ul>
              <p>
                <strong>Real example:</strong> "My son was struggling with fractions in fifth grade. The teacher didn't have time to reteach, and he was expected to 'figure it out.' SmartCore found the gaps in his understanding (turns out he never fully mastered multiplication), filled them, and now he's caught up and confident."
              </p>

              <h3 className="text-xl font-bold mt-6">3. Summer Learning to Prevent Slide</h3>
              <p>
                Research shows students lose 1-2 months of academic progress over summer break—disproportionately affecting lower-income students who don't have access to camps, tutors, or enrichment programs.
              </p>
              <p>
                Use SmartCore over the summer to:
              </p>
              <ul className="space-y-2">
                <li>Review previous year's material to prevent forgetting</li>
                <li>Preview upcoming year's content so they start ahead</li>
                <li>Work on specific weak areas identified by end-of-year testing</li>
                <li>Keep the brain active without "summer school" stigma</li>
              </ul>
              <p>
                20-30 minutes per day, 3-4 days per week is enough to maintain momentum and arrive at the new school year ready to learn.
              </p>

              <h2 className="text-2xl font-bold mt-8">Why Traditional Tutoring Falls Short</h2>
              <p>
                Many families try hiring a tutor to supplement school. But traditional tutoring has limitations:
              </p>
              <ul className="space-y-2">
                <li><strong>Expensive:</strong> $50-$100+ per hour, unsustainable for most families</li>
                <li><strong>Scheduling constraints:</strong> Finding mutual availability is a logistical nightmare</li>
                <li><strong>Inconsistent quality:</strong> No guarantee your tutor is actually skilled at teaching</li>
                <li><strong>Limited scope:</strong> Usually focuses on one subject only</li>
                <li><strong>No diagnostics:</strong> Tutor guesses at what to work on based on homework</li>
              </ul>
              <p>
                SmartCore provides expert-level tutoring across all subjects, available 24/7, with built-in diagnostics—at a fraction of the cost.
              </p>

              <h2 className="text-2xl font-bold mt-8">Working Alongside School, Not Against It</h2>
              <p>
                One concern parents have: "Won't using a supplement confuse my child if it teaches differently than their school?"
              </p>
              <p>
                SmartCore is designed to align with state standards that guide your child's public school curriculum. We're teaching the same concepts—just with personalized pacing, adaptive instruction, and more one-on-one attention than a classroom teacher can provide.
              </p>
              <p>
                Think of it like this: School provides the foundation. SmartCore provides the scaffolding, support, and extension work that ensures every child can build as high as their potential allows.
              </p>

              <h2 className="text-2xl font-bold mt-8">Time Commitment: Less Than You Think</h2>
              <p>
                Most families use SmartCore for:
              </p>
              <ul className="space-y-2">
                <li><strong>Enrichment:</strong> 20-30 minutes per day, 4-5 days per week</li>
                <li><strong>Intervention:</strong> 30-45 minutes per day, 5 days per week</li>
                <li><strong>Summer maintenance:</strong> 20-30 minutes per day, 3-4 days per week</li>
              </ul>
              <p>
                The AI handles all planning, grading, and progress tracking—you just provide the encouragement and accountability.
              </p>

              <h2 className="text-2xl font-bold mt-8">Public School + SmartCore = Best of Both Worlds</h2>
              <p>
                Public school provides:
              </p>
              <ul className="space-y-2">
                <li>Socialization and peer interaction</li>
                <li>Extracurriculars (sports, band, clubs)</li>
                <li>Credentialed teachers and structured environment</li>
                <li>Free education with community resources</li>
              </ul>
              <p>
                SmartCore adds:
              </p>
              <ul className="space-y-2">
                <li>Personalized pacing and adaptive instruction</li>
                <li>Mastery-based progression (no knowledge gaps)</li>
                <li>Enrichment and acceleration for advanced learners</li>
                <li>Targeted intervention for struggling students</li>
                <li>AI-powered diagnostics and progress tracking</li>
              </ul>
              <p>
                Together, they create an educational experience that's both socially rich and academically optimized.
              </p>

              <h2 className="text-2xl font-bold mt-8">What Parents Tell Us</h2>
              <blockquote className="border-l-4 border-primary pl-4 italic my-6">
                "We love our public school, but my son was getting lost in the shuffle. SmartCore gave him the individualized attention he needed to catch up. His teacher even noticed the improvement and asked what we were doing differently."
              </blockquote>
              <blockquote className="border-l-4 border-primary pl-4 italic my-6">
                "My daughter was bored in school—she'd finish work early and then distract other kids. SmartCore gives her challenging enrichment work that keeps her engaged. She still goes to school for friends and activities, but now her brain is challenged too."
              </blockquote>
              <blockquote className="border-l-4 border-primary pl-4 italic my-6">
                "Summer slide was destroying all the progress my kids made during the school year. Using SmartCore over summer break meant they came back ready to learn instead of having to spend two months re-learning what they forgot."
              </blockquote>

              <h2 className="text-2xl font-bold mt-8">The Bottom Line</h2>
              <p>
                Public school teachers are doing their best with limited resources and impossible class sizes. They want every child to succeed—they just don't have the time or tools to personalize learning for 30+ students.
              </p>
              <p>
                SmartCore isn't a criticism of public education—it's a tool that helps your child get the individualized attention they deserve while still benefiting from the social and structural advantages of traditional school.
              </p>
              <p className="text-xl font-semibold">
                Your child deserves both. Now they can have both.
              </p>

              <div className="border-t pt-8 mt-12">
                <div className="bg-muted/50 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-3">Supplement Smart—Not Hard</h3>
                  <p className="mb-4">
                    Whether your child needs enrichment, intervention, or summer learning, SmartCore provides personalized instruction that works alongside their public school education. Start with a free diagnostic to see exactly where they are and what they need.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    No long-term commitment required. Try it risk-free and see the difference personalized learning makes.
                  </p>
                </div>
                <Button size="lg" className="w-full" onClick={() => navigate('/auth')}>
                  Start Free Diagnostic Assessment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
