import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';

export default function WhyDiagnosticsArentTests() {
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
                <Badge variant="secondary">Philosophy</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  December 15, 2024
                </span>
                <span className="text-sm text-muted-foreground">• 5 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Why Diagnostics Aren't Tests (And Why That Changes Everything)
              </h1>
            </div>

            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                For most students, the word "test" triggers anxiety. For neurodivergent learners, it can be paralyzing. 
                But what if we stopped testing kids and started understanding them instead?
              </p>

              <h2 className="text-2xl font-bold mt-8">The Problem With Testing</h2>
              <p>
                Traditional tests serve one purpose: to measure what you know <em>right now</em>, in this moment, under pressure, 
                with one chance to get it right. Miss the mark? That failure follows you—in your transcript, your confidence, 
                your relationship with learning.
              </p>

              <p>
                For neurodivergent kids, this model is especially cruel:
              </p>

              <ul className="space-y-2">
                <li>ADHD students struggle with timed pressure and working memory demands</li>
                <li>Autistic learners face sensory overwhelm in testing environments</li>
                <li>Anxious kids spiral when stakes feel high</li>
                <li>Dyslexic students lose points to reading speed, not comprehension</li>
              </ul>

              <p>
                The result? Brilliant minds shut down. Capable students avoid challenges. Learning becomes something to fear.
              </p>

              <h2 className="text-2xl font-bold mt-8">Enter: The Diagnostic Assessment</h2>
              <p>
                A diagnostic isn't trying to judge you. It's trying to <em>understand</em> you.
              </p>

              <p>
                Think of it like a map. When you take a diagnostic on a topic you don't fully understand yet, you're not failing—
                you're creating a personalized roadmap to mastery. Every question you get wrong is a gift: it tells the AI exactly 
                what you need to learn next.
              </p>

              <h3 className="text-xl font-bold mt-6">Here's what makes diagnostics different:</h3>

              <div className="bg-muted/50 rounded-lg p-6 space-y-4 my-6">
                <div>
                  <p className="font-semibold">Tests ask: "What do you know?"</p>
                  <p className="text-muted-foreground">Diagnostics ask: "What are you ready to learn next?"</p>
                </div>
                <div>
                  <p className="font-semibold">Tests punish gaps with failing grades</p>
                  <p className="text-muted-foreground">Diagnostics reward honesty with personalized curriculum</p>
                </div>
                <div>
                  <p className="font-semibold">Tests create shame around weakness</p>
                  <p className="text-muted-foreground">Diagnostics celebrate the courage to discover</p>
                </div>
                <div>
                  <p className="font-semibold">Tests have one right answer</p>
                  <p className="text-muted-foreground">Diagnostics have one right outcome: understanding you better</p>
                </div>
              </div>

              <h2 className="text-2xl font-bold mt-8">The Courage to Not Know</h2>
              <p>
                When my daughter took her first diagnostic assessment on our platform, she scored 35%. 
                In a traditional classroom, that's a failing F—something to hide, something to be ashamed of.
              </p>

              <p>
                But she lit up when she saw the "Courage Badge" pop up on her screen. The system thanked her for being 
                honest about what she didn't know. Within minutes, it had generated a personalized learning path targeting 
                exactly the 65% she needed to work on.
              </p>

              <p>
                Three weeks later, she asked to take <em>another</em> diagnostic. Not because she was required to—because 
                she was curious. She wanted to see what else she might not know yet.
              </p>

              <p>
                That's when I knew we'd broken through the fear.
              </p>

              <h2 className="text-2xl font-bold mt-8">How It Works in Practice</h2>
              <p>
                Our platform uses two completely separate systems:
              </p>

              <ol className="space-y-4 list-decimal list-inside">
                <li>
                  <strong>Diagnostic Assessments:</strong> Ungraded, unlimited attempts, designed to reveal gaps. 
                  The more honest you are about what you don't know, the better your curriculum becomes. 
                  These never appear on transcripts—they're pure learning tools.
                </li>
                <li>
                  <strong>Mastery Demonstrations:</strong> When you're confident you've learned something, 
                  <em>you</em> decide to take a mastery assessment. This one gets graded for your transcript. 
                  But you only take it when you're ready—after the diagnostics have helped you fill your gaps.
                </li>
              </ol>

              <p>
                This separation is crucial. It means you can be vulnerable and honest during learning without academic consequences. 
                You can fail forward every single day, knowing it's building toward eventual mastery.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Neuroscience Behind It</h2>
              <p>
                Research shows that <strong>low-stakes testing with immediate feedback</strong> is one of the most effective 
                learning strategies. But it only works when students feel safe enough to try.
              </p>

              <p>
                For neurodivergent learners especially, <strong>psychological safety</strong> unlocks everything. When you remove 
                the shame of not knowing, the brain can actually process information. When you celebrate discovery instead of 
                punishing mistakes, motivation becomes intrinsic.
              </p>

              <p>
                That's not feel-good theory. That's how learning works.
              </p>

              <h2 className="text-2xl font-bold mt-8">What Parents Tell Us</h2>
              <p>
                "My son used to have meltdowns before tests. Now he <em>asks</em> to take diagnostics."
              </p>

              <p>
                "She went from 'I'm bad at math' to 'I just discovered what I need to learn next.'"
              </p>

              <p>
                "For the first time, I'm not bribing him to study. He's genuinely curious about his gaps."
              </p>

              <h2 className="text-2xl font-bold mt-8">The Bottom Line</h2>
              <p>
                Tests were designed to sort students. Diagnostics are designed to <em>understand</em> them.
              </p>

              <p>
                When you reframe "I don't know this yet" as a starting point rather than a failure, everything changes. 
                Learning becomes an adventure. Gaps become opportunities. And neurodivergent kids—who've been told they're 
                "behind" their whole lives—finally get to be seen for what they actually are:
              </p>

              <p className="text-xl font-semibold">
                Brilliant learners who just needed someone to understand their brain first.
              </p>

              <div className="border-t pt-8 mt-12">
                <p className="text-muted-foreground italic">
                  Ready to try a different approach? Start your diagnostic journey—no judgment, just discovery.
                </p>
                <Button 
                  size="lg" 
                  className="mt-4"
                  onClick={() => navigate('/auth')}
                >
                  Get Started Free
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}