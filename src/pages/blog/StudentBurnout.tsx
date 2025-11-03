import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MarketingNav } from '@/components/MarketingNav';
import studentStress from '@/assets/blog/student-stress.jpg';

export default function StudentBurnout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      
      <article className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/blog')}
            className="mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>

          <header className="mb-8 space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Student Wellbeing</span>
              <span>•</span>
              <span>January 14, 2025</span>
              <span>•</span>
              <span>8 min read</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Preventing Student Burnout: Recognizing Warning Signs and Creating Sustainable Learning
            </h1>
          </header>

          <img 
            src={studentStress}
            alt="Student experiencing stress and overwhelm" 
            className="w-full h-auto rounded-lg mb-8"
          />

          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-muted-foreground mb-6">
              Academic pressure without adequate recovery leads to burnout—even in homeschool settings where we have more control over pace and environment. Learn to spot the early warning signs and build a learning rhythm that protects your child's mental health while maintaining academic progress.
            </p>

            <h2>What Student Burnout Actually Looks Like</h2>
            <p>
              Burnout isn't just "being tired." It's a specific pattern of emotional, physical, and cognitive exhaustion that happens when demands consistently exceed available resources for recovery.
            </p>
            <p>
              Early warning signs include:
            </p>
            <ul>
              <li><strong>Physical symptoms:</strong> Frequent headaches, stomach issues, disrupted sleep patterns, or constant fatigue</li>
              <li><strong>Emotional dysregulation:</strong> Increased irritability, tearfulness over minor setbacks, or emotional flatness</li>
              <li><strong>Cognitive changes:</strong> Difficulty concentrating, memory problems, or slower processing</li>
              <li><strong>Behavioral shifts:</strong> Procrastination, avoiding previously enjoyed subjects, or perfectionism spiraling</li>
              <li><strong>Loss of motivation:</strong> "I don't care anymore" becoming a daily refrain</li>
            </ul>

            <h2>The Homeschool Burnout Paradox</h2>
            <p>
              Homeschooling should protect against burnout—we control the schedule, we know our children intimately, we can adjust on the fly. So why do homeschool students still burn out?
            </p>
            <p>
              Common homeschool burnout triggers:
            </p>
            <ul>
              <li><strong>Perfectionism without boundaries:</strong> The flexibility to "do it perfectly" becomes pressure to never stop improving</li>
              <li><strong>Comparison culture:</strong> Social media homeschool perfection creating unrealistic standards</li>
              <li><strong>Lack of clear work boundaries:</strong> "School" bleeding into all hours because there's no bell schedule</li>
              <li><strong>Isolation:</strong> Missing the social energy and peer motivation of traditional school</li>
              <li><strong>Parent anxiety transmission:</strong> When parents stress about outcomes, children absorb that pressure</li>
            </ul>

            <h2>Building Sustainable Learning Rhythms</h2>
            <p>
              Sustainable learning isn't about lowering standards—it's about matching intensity with adequate recovery.
            </p>

            <h3>The 70% Rule</h3>
            <p>
              Plan your week to operate at 70% capacity, not 100%. This creates buffer space for:
            </p>
            <ul>
              <li>Unexpected challenges taking longer than planned</li>
              <li>Low-energy days requiring gentler approaches</li>
              <li>Interest-led detours that emerge organically</li>
              <li>True rest without guilt or falling behind</li>
            </ul>

            <h3>Cyclic Learning Patterns</h3>
            <p>
              Instead of steady-state learning year-round, consider natural cycles:
            </p>
            <ul>
              <li><strong>Sprint weeks:</strong> Higher intensity with clear finish lines</li>
              <li><strong>Maintenance weeks:</strong> Lighter load focusing on review and consolidation</li>
              <li><strong>Recovery periods:</strong> Scheduled breaks that are truly restful, not "catch-up" time</li>
              <li><strong>Project seasons:</strong> Deep dives into engaging topics with built-in conclusion points</li>
            </ul>

            <h2>Recovery Is Not Optional</h2>
            <p>
              Rest isn't a reward for productivity—it's a biological requirement for learning. During recovery periods, the brain:
            </p>
            <ul>
              <li>Consolidates new information into long-term memory</li>
              <li>Makes connections between disparate concepts</li>
              <li>Repairs stress-related damage to neural pathways</li>
              <li>Restores executive function capacity</li>
            </ul>
            <p>
              Without adequate recovery, learning efficiency drops dramatically. You end up spending more time achieving less.
            </p>

            <h2>When to Hit Pause</h2>
            <p>
              Sometimes the best academic decision is to stop. Indicators it's time for a real break:
            </p>
            <ul>
              <li>Your child starts crying at the mention of a subject they previously enjoyed</li>
              <li>Physical symptoms emerge or intensify around school time</li>
              <li>You're spending more time on emotional regulation than actual learning</li>
              <li>Sleep problems appear or worsen</li>
              <li>Family relationships are straining under academic pressure</li>
            </ul>
            <p>
              A two-week complete pause to reset often accomplishes more than grinding through burnout for months.
            </p>

            <h2>Creating Burnout-Resistant Systems</h2>
            <p>
              SmartCore's design specifically addresses burnout risk:
            </p>
            <ul>
              <li><strong>Mastery pacing:</strong> Students progress when they're ready, removing the pressure of artificial timelines</li>
              <li><strong>Daily check-ins:</strong> Quick diagnostics catch struggles early, before they compound into overwhelm</li>
              <li><strong>Flexible scheduling:</strong> System adapts to energy levels and life circumstances</li>
              <li><strong>Built-in breaks:</strong> Recovery time is scheduled into curriculum, not treated as falling behind</li>
              <li><strong>Progress visibility:</strong> Students see concrete evidence of growth, combating "I'm not learning anything" despair</li>
            </ul>

            <h2>The Long Game</h2>
            <p>
              Education is a marathon, not a sprint. Protecting your child's love of learning, mental health, and intrinsic motivation matters more than covering every standard this particular year.
            </p>
            <p>
              A child who finishes the year slightly behind grade level but still curious is in better shape than a child who's technically on track but burned out and hating learning.
            </p>
            <p>
              Build sustainability into your homeschool from the start. Your future self—and your child—will thank you.
            </p>

            <div className="mt-12 p-6 bg-muted rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Ready to Build Sustainable Learning?</h3>
              <p className="mb-4">
                SmartCore's adaptive pacing and burnout prevention features help create learning rhythms that last.
              </p>
              <Button onClick={() => navigate('/auth')}>
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}