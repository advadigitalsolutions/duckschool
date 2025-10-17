import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';

export default function JustInTimeCurriculum() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      
      <article className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            <Button 
              variant="ghost" 
              className="mb-4"
              onClick={() => navigate('/blog')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Innovation</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  January 5, 2025
                </span>
                <span className="text-sm text-muted-foreground">• 8 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Just-In-Time Curriculum: Teaching What Your Child Needs, Exactly When They Need It
              </h1>
            </div>

            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                Forget year-long curriculum plans. AI-powered Just-In-Time learning delivers personalized instruction based on daily diagnostic data—meeting each student exactly where they are, every single day.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Problem with Pre-Planned Curriculum</h2>
              <p>
                Traditional education—including most homeschool programs—works like this:
              </p>

              <ol className="space-y-2 list-decimal list-inside">
                <li>Buy a year's worth of curriculum in August</li>
                <li>Follow the scope and sequence no matter what</li>
                <li>Hope your child is ready for each lesson when it arrives</li>
                <li>Feel guilty when you fall behind or skip ahead</li>
              </ol>

              <p>
                But kids don't learn in neat, predictable sequences. They:
              </p>
              <ul className="space-y-2">
                <li>Master some concepts instantly and get bored waiting</li>
                <li>Hit walls on others and need more time</li>
                <li>Make unexpected connections between topics</li>
                <li>Lose interest when forced to move at a fixed pace</li>
              </ul>

              <p>
                Pre-planned curriculum assumes all students learn the same concepts at the same speed in the same order. Your child is not a standardized factory product.
              </p>

              <h2 className="text-2xl font-bold mt-8">How Just-In-Time Curriculum Works</h2>

              <h3 className="text-xl font-bold mt-6">1. Daily Diagnostic Assessment</h3>
              <p>
                Instead of guessing what your child knows, we measure it. Short diagnostic assessments reveal exactly what they've mastered and where gaps exist. These aren't stressful tests—they're quick check-ins that inform the AI.
              </p>

              <h3 className="text-xl font-bold mt-6">2. AI Generates Tomorrow's Lessons Today</h3>
              <p>
                Based on today's work, the AI generates tomorrow's curriculum. It:
              </p>
              <ul className="space-y-2">
                <li>Identifies the next most logical concept to teach</li>
                <li>Reviews prerequisites if gaps are detected</li>
                <li>Accelerates if your child demonstrated mastery</li>
                <li>Integrates across subjects based on readiness</li>
              </ul>

              <h3 className="text-xl font-bold mt-6">3. Personalized, Not Standardized</h3>
              <p>
                Your child gets curriculum designed specifically for them—not a one-size-fits-all lesson plan designed for the "average" student (who doesn't actually exist).
              </p>

              <h2 className="text-2xl font-bold mt-8">Real-World Example: Fractions</h2>
              <p>
                Traditional curriculum says: "Teach fractions in November of 4th grade."
              </p>

              <p>
                But what if your child:
              </p>
              <ul className="space-y-2">
                <li>Already understands halves and quarters from cooking?</li>
                <li>Still struggles with basic division (the prerequisite)?</li>
                <li>Is gifted in math and ready for fractions in 3rd grade?</li>
                <li>Has dyscalculia and needs visual, hands-on fraction work?</li>
              </ul>

              <p>
                Just-In-Time curriculum adapts:
              </p>
              <ul className="space-y-2">
                <li><strong>Advanced learner:</strong> Skips review, moves to complex fractions</li>
                <li><strong>Needs foundation:</strong> Backs up to master division first</li>
                <li><strong>Visual learner:</strong> Gets fraction bars and pizza models</li>
                <li><strong>Culinary interest:</strong> Learns through recipe modification</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">The Spiraling Effect</h2>
              <p>
                Just-In-Time learning naturally creates spiraling curriculum—concepts are revisited at increasing depth as students are ready. The AI tracks:
              </p>
              <ul className="space-y-2">
                <li>When a concept was last practiced</li>
                <li>How well it was retained</li>
                <li>Which related concepts are now being learned</li>
                <li>Optimal timing for review</li>
              </ul>

              <p>
                Students don't "forget" material because they moved on too quickly. They review and deepen understanding exactly when their brain is ready for it.
              </p>

              <h2 className="text-2xl font-bold mt-8">Multi-Subject Integration</h2>
              <p>
                Real learning isn't siloed by subject. Just-In-Time curriculum creates natural connections:
              </p>

              <div className="bg-muted/50 rounded-lg p-6 space-y-4 my-6">
                <div>
                  <p className="font-semibold">Learning about Ancient Rome in history?</p>
                  <p className="text-muted-foreground">Math introduces Roman numerals and aqueduct engineering problems.</p>
                </div>
                <div>
                  <p className="font-semibold">Reading about ecosystems in science?</p>
                  <p className="text-muted-foreground">ELA assigns descriptive writing about local nature observations.</p>
                </div>
                <div>
                  <p className="font-semibold">Child expressed interest in baking?</p>
                  <p className="text-muted-foreground">Chemistry, fractions, and measurement all connect through that lens.</p>
                </div>
              </div>

              <p>
                The AI weaves subjects together based on what's being learned now—not what a curriculum designer planned 18 months ago.
              </p>

              <h2 className="text-2xl font-bold mt-8">Benefits for Different Learners</h2>

              <h3 className="text-xl font-bold mt-6">Gifted Learners</h3>
              <p>
                They don't sit through review they don't need. The AI detects mastery and accelerates. A gifted 4th grader might work through 6th-grade math while staying age-appropriate in other subjects.
              </p>

              <h3 className="text-xl font-bold mt-6">Struggling Learners</h3>
              <p>
                They aren't dragged along by the calendar. The AI identifies exactly what foundational skill is missing and fills it before moving forward. No shame, no pressure—just strategic gap-filling.
              </p>

              <h3 className="text-xl font-bold mt-6">Twice-Exceptional (2e) Students</h3>
              <p>
                Advanced in some areas, behind in others? Just-In-Time curriculum meets them at each level individually. They can excel in strength areas while getting support in challenge areas—simultaneously.
              </p>

              <h2 className="text-2xl font-bold mt-8">Parent Control with AI Support</h2>
              <p>
                Parents maintain oversight:
              </p>
              <ul className="space-y-2">
                <li>Review what the AI plans to teach tomorrow</li>
                <li>Adjust pacing or emphasis on specific topics</li>
                <li>Request curriculum around upcoming trips or interests</li>
                <li>Set learning goals the AI works toward</li>
              </ul>

              <p>
                Think of it like cruise control that you can override. The AI handles day-to-day adjustments, but you're always the driver.
              </p>

              <h2 className="text-2xl font-bold mt-8">Standards Compliance Without Rigidity</h2>
              <p>
                Here's the magic: Just-In-Time curriculum still covers all state standards—just in the order your child is ready for them. The AI tracks standards mastery in the background, ensuring nothing gets missed even as the sequence flexes.
              </p>

              <p>
                By year-end, all required standards are covered. But the path there is uniquely theirs.
              </p>

              <h2 className="text-2xl font-bold mt-8">What Parents Tell Us</h2>
              <p>
                "I used to dread planning next year's curriculum. Now I don't plan at all—the AI does it daily based on real data."
              </p>

              <p>
                "My son was bored to tears with traditional curriculum. Just-In-Time keeps him challenged without overwhelming him."
              </p>

              <p>
                "For the first time, I'm teaching what my child actually needs instead of what page we're supposed to be on."
              </p>

              <h2 className="text-2xl font-bold mt-8">The Bottom Line</h2>
              <p>
                Education has operated on the factory model for 150 years: move students through at a fixed pace, regardless of individual readiness. That model was never effective—and with AI, it's finally obsolete.
              </p>

              <p>
                Just-In-Time curriculum is education redesigned around how humans actually learn: flexibly, personally, responsively. It meets each child where they are today and takes them where they need to go tomorrow.
              </p>

              <p className="text-xl font-semibold">
                Not where the scope-and-sequence says they should be. Where they're actually ready to go.
              </p>

              <div className="border-t pt-8 mt-12">
                <p className="text-muted-foreground italic">
                  Ready to stop planning and start adapting?
                </p>
                <Button 
                  size="lg" 
                  className="mt-4"
                  onClick={() => navigate('/auth')}
                >
                  Experience Just-In-Time Learning
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
