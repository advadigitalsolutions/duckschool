import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';

export default function ADHDSupport() {
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
                <Badge variant="secondary">Neurodivergence</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  January 12, 2025
                </span>
                <span className="text-sm text-muted-foreground">• 8 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Built for ADHD Brains: How Duckschool Turns Executive Function Challenges into Strengths
              </h1>
            </div>

            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                Most educational platforms assume you can sit still, focus linearly, and remember everything. We assume something different: that ADHD brains are brilliantly wired for depth, creativity, and hyperfocus—when the environment supports them.
              </p>

              <h2 className="text-2xl font-bold mt-8">The ADHD Education Paradox</h2>
              <p>
                Kids with ADHD often get labeled as "smart but lazy" or "won't apply themselves." The truth? They're trying harder than anyone else—fighting their brain's wiring every step of the way.
              </p>

              <p>
                Traditional education demands:
              </p>
              <ul className="space-y-2">
                <li>Sit still for hours</li>
                <li>Switch between subjects on a bell schedule (not when you're ready)</li>
                <li>Remember multi-step instructions</li>
                <li>Organize binders, track deadlines, manage materials</li>
                <li>Focus when <em>told</em> to focus, not when naturally engaged</li>
              </ul>

              <p>
                These are all executive function skills—the very skills ADHD directly impacts. It's like asking someone with broken legs to run a marathon, then calling them lazy when they can't.
              </p>

              <h2 className="text-2xl font-bold mt-8">How Duckschool Supports ADHD Learners</h2>

              <h3 className="text-xl font-bold mt-6">1. Chunked, Focused Lessons</h3>
              <p>
                No hour-long blocks. Every assignment is broken into 15-20 minute focused segments. Work for 20 minutes, take a movement break, come back. The platform auto-saves constantly—losing work due to distraction is impossible.
              </p>

              <h3 className="text-xl font-bold mt-6">2. Gamified Progress Tracking</h3>
              <p>
                ADHD brains crave novelty and immediate feedback. Our XP system, daily streaks, and visual progress bars trigger dopamine responses naturally. Completing work isn't just "doing your homework"—it's leveling up, earning badges, watching your duck climb the focus tree.
              </p>

              <h3 className="text-xl font-bold mt-6">3. Hyperfocus-Friendly Deep Dives</h3>
              <p>
                When ADHD students find something interesting, they can hyperfocus for hours. We support this by allowing students to dive deep into topics of interest while the AI ensures core standards still get covered. Obsessed with dinosaurs? Great—we'll teach fractions through fossil measurements.
              </p>

              <h3 className="text-xl font-bold mt-6">4. Built-In Pomodoro Timer</h3>
              <p>
                Our focus duck sits on your screen, helping manage work/break cycles. 25 minutes of work, 5-minute break. The duck celebrates your focused sessions and gently reminds you when it's time to rest or refocus.
              </p>

              <h3 className="text-xl font-bold mt-6">5. Zero Organization Required</h3>
              <p>
                The platform is the organizer. No binders to lose. No assignment sheets to track. The AI schedules everything, sends reminders, and prioritizes what's due. Students can focus on learning instead of executive function gymnastics.
              </p>

              <h3 className="text-xl font-bold mt-6">6. Flexible Scheduling</h3>
              <p>
                ADHD medication often makes mornings easier and afternoons harder (or vice versa). Our platform doesn't care <em>when</em> work gets done. Schedule assignments for 5am if that's when your brain works. The AI adapts to your rhythm.
              </p>

              <h2 className="text-2xl font-bold mt-8">Working Memory Support</h2>
              <p>
                ADHD impacts working memory—the mental scratch pad you use to hold information while processing it. Traditional education demands you remember:
              </p>
              <ul className="space-y-2">
                <li>Multi-step instructions given verbally</li>
                <li>Page numbers, due dates, material lists</li>
                <li>Previous concepts while learning new ones</li>
              </ul>

              <p>
                Duckschool offloads working memory demands:
              </p>
              <ul className="space-y-2">
                <li>Instructions available in written, visual, and audio formats</li>
                <li>Previous concepts reviewed automatically before new lessons</li>
                <li>Everything needed for each assignment included—no hunting for materials</li>
                <li>Text-to-speech for all written content</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">Emotional Regulation Tools</h2>
              <p>
                ADHD often comes with emotional dysregulation—big feelings that come fast and strong. The platform includes:
              </p>
              <ul className="space-y-2">
                <li>AI coach that validates frustration ("This IS hard. Want to try a different approach?")</li>
                <li>Built-in breaks before meltdowns happen</li>
                <li>Celebration moments for small wins (crucial for ADHD motivation)</li>
                <li>No public failure—diagnostics are private, not graded</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">Parent Dashboard: Supporting Without Nagging</h2>
              <p>
                Parents can see progress without hovering. The system sends gentle nudges to students automatically, so you don't have to be the bad guy reminding them about homework. You can focus on encouragement instead of enforcement.
              </p>

              <h2 className="text-2xl font-bold mt-8">What Parents of ADHD Kids Tell Us</h2>
              <p>
                "Before Duckschool, homework battles destroyed our relationship. Now he's self-motivated because the system works <em>with</em> his brain, not against it."
              </p>

              <p>
                "The visual progress tracking is everything. She can SEE that she's making progress, which keeps her going on hard days."
              </p>

              <p>
                "He has ADHD and dyslexia. The combination of text-to-speech, chunked lessons, and gamification? Game changer. First time he's enjoyed learning in years."
              </p>

              <h2 className="text-2xl font-bold mt-8">ADHD Isn't a Deficit—It's a Different Operating System</h2>
              <p>
                ADHD brains aren't broken. They're wired for:
              </p>
              <ul className="space-y-2">
                <li>Creative problem-solving</li>
                <li>Hyperfocus on interesting topics</li>
                <li>Outside-the-box thinking</li>
                <li>High energy and enthusiasm</li>
                <li>Spontaneity and adaptability</li>
              </ul>

              <p>
                Traditional school forces them into a neurotypical box. Duckschool builds the learning environment around how their brain actually works.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Bottom Line</h2>
              <p>
                If your ADHD child has been told they're "smart but unfocused," "has potential but doesn't try," or "needs to apply themselves"—they're not the problem. The system wasn't built for them.
              </p>

              <p className="text-xl font-semibold">
                Duckschool was. And the results speak for themselves.
              </p>

              <div className="border-t pt-8 mt-12">
                <p className="text-muted-foreground italic">
                  Ready to see your ADHD learner thrive?
                </p>
                <Button 
                  size="lg" 
                  className="mt-4"
                  onClick={() => navigate('/auth')}
                >
                  Start Your Free Trial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
