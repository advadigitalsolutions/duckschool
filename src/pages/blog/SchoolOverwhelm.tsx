import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowLeft } from 'lucide-react';
import { MarketingNav } from '@/components/MarketingNav';
import libraryOverwhelm from '@/assets/blog/library-overwhelm.jpg';

export default function SchoolOverwhelm() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      
      <article className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Mental Health</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  January 11, 2025
                </span>
                <span className="text-sm text-muted-foreground">• 7 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                When School Feels Overwhelming: Supporting Students Through Academic Anxiety
              </h1>
            </div>

            <img 
              src={libraryOverwhelm}
              alt="Student experiencing overwhelm in academic setting" 
              className="w-full h-[400px] object-cover rounded-lg"
            />

            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
            <p className="text-xl text-muted-foreground mb-6">
              For sensitive, perfectionistic, or neurodivergent learners, school overwhelm isn't about lacking effort—it's about processing capacity, pace mismatches, and environmental demands exceeding available coping resources. Here's how to recognize and address academic overwhelm before it becomes crisis.
            </p>

            <h2>What School Overwhelm Looks Like</h2>
            <p>
              Overwhelm manifests differently than simple stress:
            </p>
            <ul>
              <li><strong>Paralysis:</strong> Unable to start tasks despite knowing what needs doing</li>
              <li><strong>Catastrophic thinking:</strong> "If I fail this assignment, my entire life is ruined"</li>
              <li><strong>Physical symptoms:</strong> Stomach aches, headaches, or panic attacks triggered by school</li>
              <li><strong>Emotional flooding:</strong> Tears or meltdowns that seem disproportionate to the trigger</li>
              <li><strong>Shutdown:</strong> Complete withdrawal or dissociation around academic demands</li>
              <li><strong>Avoidance:</strong> Elaborate procrastination strategies or school refusal</li>
            </ul>

            <h2>Why Sensitive Learners Experience More Overwhelm</h2>
            <p>
              Some students are neurologically wired to experience school differently:
            </p>

            <h3>Sensory Processing Sensitivity</h3>
            <p>
              Highly sensitive students process sensory and emotional information more deeply:
            </p>
            <ul>
              <li>Classroom noise, fluorescent lighting, or visual clutter creates cognitive overload</li>
              <li>Emotional atmospheres (teacher stress, peer tension) are physically exhausting</li>
              <li>Subtle environmental stimuli others ignore consume processing bandwidth</li>
            </ul>

            <h3>Perfectionism and High Standards</h3>
            <p>
              Gifted or high-achieving students may overwhelm themselves:
            </p>
            <ul>
              <li>Setting unrealistic internal standards no human could meet</li>
              <li>Interpreting any grade below perfect as failure</li>
              <li>Catastrophizing mistakes instead of seeing them as learning opportunities</li>
              <li>Comparing their behind-the-scenes struggles to others' polished outcomes</li>
            </ul>

            <h3>Executive Function Challenges</h3>
            <p>
              ADHD and autistic students face systematic overwhelm:
            </p>
            <ul>
              <li><strong>Task initiation difficulties:</strong> Knowing what to do but unable to start</li>
              <li><strong>Organization overwhelm:</strong> Multi-step projects feel impossibly complex</li>
              <li><strong>Time blindness:</strong> Inability to estimate or track time accurately</li>
              <li><strong>Transition difficulty:</strong> Switching between subjects or activities is cognitively expensive</li>
            </ul>

            <h3>Processing Speed Mismatches</h3>
            <p>
              When instruction pace exceeds processing speed:
            </p>
            <ul>
              <li>Students fall behind despite understanding material</li>
              <li>Chronic sense of "not enough time" creates constant pressure</li>
              <li>Having to rush prevents deep understanding, triggering anxiety</li>
            </ul>

            <h2>The Overwhelm Spiral</h2>
            <p>
              Overwhelm tends to compound:
            </p>
            <ol>
              <li><strong>Initial overload:</strong> Task feels too big or complex</li>
              <li><strong>Freeze response:</strong> Nervous system shuts down; can't start</li>
              <li><strong>Time passes:</strong> Deadline approaches, increasing pressure</li>
              <li><strong>Anxiety spikes:</strong> Now dealing with both task and time pressure</li>
              <li><strong>Deeper freeze:</strong> Even more paralyzed by heightened anxiety</li>
              <li><strong>Shame layer:</strong> "I'm lazy/stupid/broken" thoughts compound stress</li>
              <li><strong>Crisis:</strong> Last-minute panic, poor-quality work, or complete shutdown</li>
            </ol>
            <p>
              Breaking this cycle requires intervention early, before the spiral accelerates.
            </p>

            <h2>Immediate Strategies for Overwhelm Episodes</h2>

            <h3>In-the-Moment Nervous System Regulation</h3>
            <p>
              When your child is actively overwhelmed:
            </p>
            <ul>
              <li><strong>Physical grounding:</strong> Cold water on face, weighted blanket, or movement</li>
              <li><strong>Breathing techniques:</strong> Box breathing (4-4-4-4) or longer exhales than inhales</li>
              <li><strong>Reduce sensory input:</strong> Quiet space, dim lighting, minimal stimulation</li>
              <li><strong>Connection before correction:</strong> Comfort and validation before problem-solving</li>
            </ul>
            <p>
              You cannot problem-solve when the nervous system is in fight/flight/freeze. Regulation comes first.
            </p>

            <h3>Task Breakdown</h3>
            <p>
              Overwhelming tasks need chunking:
            </p>
            <ul>
              <li>Break into literally tiny steps (not "write essay"—"open document")</li>
              <li>Do one micro-step, then reassess (momentum builds gradually)</li>
              <li>Celebrate micro-completions (dopamine reward for starting)</li>
              <li>Use timers: short work sprints (10-15 min) with breaks</li>
            </ul>

            <h3>Lower the Stakes</h3>
            <p>
              Perfectionism creates artificial pressure:
            </p>
            <ul>
              <li>"Let's create a bad first draft"</li>
              <li>"This is practice, not performance"</li>
              <li>"What would be good enough for right now?"</li>
              <li>Remove grade pressure if possible—focus on learning</li>
            </ul>

            <h2>Long-Term Overwhelm Prevention</h2>

            <h3>Environmental Modifications</h3>
            <p>
              Design learning environments to reduce overwhelm triggers:
            </p>
            <ul>
              <li><strong>Predictable schedules:</strong> Transitions less jarring when anticipated</li>
              <li><strong>Sensory-friendly spaces:</strong> Quiet areas with controlled lighting and sound</li>
              <li><strong>Visual organization systems:</strong> Reduce cognitive load of tracking tasks</li>
              <li><strong>Clear work/rest boundaries:</strong> Defined school hours prevent chronic activation</li>
            </ul>

            <h3>Capacity Building</h3>
            <p>
              Gradually increase stress tolerance (with support):
            </p>
            <ul>
              <li>Practice with low-stakes challenges</li>
              <li>Build up duration of sustained focus slowly</li>
              <li>Celebrate coping when things feel hard</li>
              <li>Teach self-advocacy: "I need a break" is legitimate</li>
            </ul>

            <h3>Metacognitive Skills</h3>
            <p>
              Help students understand their own patterns:
            </p>
            <ul>
              <li>"What does overwhelm feel like in your body?"</li>
              <li>"What usually helps you when you feel this way?"</li>
              <li>"What time of day are you most able to tackle hard things?"</li>
              <li>"What warning signs appear before full overwhelm?"</li>
            </ul>

            <h2>When Overwhelm Signals Deeper Issues</h2>
            <p>
              Sometimes academic overwhelm indicates:
            </p>
            <ul>
              <li><strong>Undiagnosed learning disabilities:</strong> Struggles stem from unaddressed learning differences</li>
              <li><strong>Anxiety disorders:</strong> Beyond situational stress into clinical anxiety requiring treatment</li>
              <li><strong>Depression:</strong> Especially when accompanied by anhedonia or hopelessness</li>
              <li><strong>Trauma:</strong> School triggers fight/flight due to past experiences</li>
            </ul>
            <p>
              If overwhelm persists despite environmental modifications and support, professional evaluation may help.
            </p>

            <h2>SmartCore's Overwhelm-Reducing Design</h2>
            <p>
              Our platform specifically addresses overwhelm triggers:
            </p>
            <ul>
              <li><strong>Self-paced progression:</strong> No artificial time pressure; students advance when ready</li>
              <li><strong>Task breakdown built-in:</strong> Complex assignments automatically chunked into manageable pieces</li>
              <li><strong>Clear progress visibility:</strong> Students see accomplishment, reducing "I'm getting nowhere" anxiety</li>
              <li><strong>Flexible scheduling:</strong> Work during peak energy times; rest when needed</li>
              <li><strong>Mastery-based advancement:</strong> Reduces perfectionism anxiety—"good enough to move on" is defined</li>
              <li><strong>Multiple assessment formats:</strong> Not all evaluation is high-stakes testing</li>
            </ul>

            <h2>Protecting Long-Term Mental Health</h2>
            <p>
              The goal isn't just managing overwhelm—it's building resilient, sustainable learning patterns:
            </p>
            <ul>
              <li>Students learn to recognize and regulate their stress responses</li>
              <li>Academic challenges feel appropriately scaled, not insurmountable</li>
              <li>Mistakes become information, not catastrophes</li>
              <li>Learning remains engaging rather than traumatizing</li>
            </ul>
            <p>
              An education that protects mental health while building competence is worth more than accelerated academics that leave students burned out and anxious.
            </p>

            <div className="mt-12 p-6 bg-muted rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Learning Without Overwhelm</h3>
              <p className="mb-4">
                SmartCore's design reduces overwhelm triggers while building genuine competence and confidence.
              </p>
              <Button onClick={() => navigate('/auth')}>
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </div>
      </article>
    </div>
  );
}