import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';
import creativeLearning from '@/assets/blog/pexels-cottonbro-6473097.jpg';

export default function CreativeLearning() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <article className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            <Button variant="ghost" onClick={() => navigate('/blog')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Holistic Education</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  December 10, 2024
                </span>
                <span className="text-sm text-muted-foreground">• 8 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Creativity in the Curriculum: Why Arts and Play Matter in Academic Success
              </h1>
            </div>
            <img src={creativeLearning} alt="Creative learning and play" className="w-full h-[400px] object-cover rounded-lg" />
            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                When we think about "serious" education, we often picture worksheets, textbooks, and standardized tests. But neuroscience reveals something counterintuitive: creative expression isn't a distraction from learning—it's often the pathway to deeper understanding.
              </p>

              <h2 className="text-3xl font-bold mt-12">The Science of Creative Learning</h2>
              <p>
                When students engage in creative activities—drawing, building, role-playing, composing—multiple brain regions activate simultaneously. This creates richer neural connections than passive consumption of information ever could.
              </p>

              <h3 className="text-2xl font-semibold mt-8">What Happens in the Creative Brain</h3>
              <ul className="space-y-3">
                <li><strong>Working memory strengthens</strong> - Juggling creative elements builds cognitive flexibility</li>
                <li><strong>Problem-solving deepens</strong> - Open-ended creation requires evaluating multiple solutions</li>
                <li><strong>Emotional engagement increases</strong> - Personal expression creates memorable learning experiences</li>
                <li><strong>Abstract thinking develops</strong> - Translating ideas into creative forms builds conceptual understanding</li>
              </ul>

              <h2 className="text-3xl font-bold mt-12">Creativity Across Subject Areas</h2>
              <p>
                The arts aren't separate from academics—they're powerful tools for mastering every subject.
              </p>

              <h3 className="text-2xl font-semibold mt-8">Math Through Creative Expression</h3>
              <p>
                Geometry comes alive through origami. Fractions become tangible through cooking. Patterns emerge through music composition. When students create with mathematical concepts rather than just calculating them, understanding deepens.
              </p>

              <h3 className="text-2xl font-semibold mt-8">Science Through Making</h3>
              <p>
                Building marble runs teaches physics. Growing gardens demonstrates life cycles and ecology. Designing solutions to real problems—like creating a better lunch box or building a bird feeder—applies scientific thinking in meaningful contexts.
              </p>

              <h3 className="text-2xl font-semibold mt-8">History Through Storytelling</h3>
              <p>
                Writing historical fiction, creating period-accurate art, or reenacting historical events helps students inhabit different perspectives and understand cause-and-effect relationships in human behavior.
              </p>

              <h3 className="text-2xl font-semibold mt-8">Language Through Play</h3>
              <p>
                Poetry, creative writing, theater, and even video creation all build language skills more effectively than grammar worksheets alone. When students have something they want to express, they become motivated to master the tools of language.
              </p>

              <h2 className="text-3xl font-bold mt-12">The Case for Unstructured Play</h2>
              <p>
                Not all learning needs to be directed. Free play—especially for younger learners—builds essential cognitive and social skills that can't be taught explicitly.
              </p>

              <h3 className="text-2xl font-semibold mt-8">What Children Learn Through Play</h3>
              <ul className="space-y-3">
                <li><strong>Executive function</strong> - Planning, organizing, and adapting strategies in real-time</li>
                <li><strong>Social negotiation</strong> - Working out rules, resolving conflicts, taking turns</li>
                <li><strong>Risk assessment</strong> - Testing boundaries and learning from mistakes in low-stakes situations</li>
                <li><strong>Imaginative thinking</strong> - The foundation of creative problem-solving and innovation</li>
                <li><strong>Intrinsic motivation</strong> - Learning to pursue activities for joy rather than external rewards</li>
              </ul>

              <h2 className="text-3xl font-bold mt-12">Balancing Structure and Freedom</h2>
              <p>
                The goal isn't to abandon academic rigor in favor of endless free play—it's to integrate creative expression and structured learning in ways that reinforce each other.
              </p>

              <h3 className="text-2xl font-semibold mt-8">Structured Creative Learning</h3>
              <p>
                Give students clear learning objectives but open-ended ways to demonstrate mastery:
              </p>
              <ul className="space-y-2">
                <li>"Show me you understand the water cycle" (could be a diagram, a story, a model, a comic strip)</li>
                <li>"Explain how fractions work" (could be through cooking, art, music, or sports analogies)</li>
                <li>"Demonstrate understanding of this historical period" (could be through essay, video, diorama, or oral presentation)</li>
              </ul>

              <h3 className="text-2xl font-semibold mt-8">Unstructured Creative Time</h3>
              <p>
                Also protect time for pure exploration without learning objectives:
              </p>
              <ul className="space-y-2">
                <li>Building with LEGOs, blocks, or craft materials</li>
                <li>Free drawing, painting, or sculpting</li>
                <li>Dramatic play and role-playing</li>
                <li>Outdoor exploration and nature observation</li>
                <li>Music making without performance pressure</li>
              </ul>

              <h2 className="text-3xl font-bold mt-12">Overcoming Creative Resistance</h2>
              <p>
                Some students—especially those who've been in traditional schools—may resist creative assignments at first. They've learned to value "right answers" and fear the uncertainty of open-ended work.
              </p>

              <h3 className="text-2xl font-semibold mt-8">Supporting Reluctant Creators</h3>
              <ul className="space-y-3">
                <li><strong>Start small</strong> - Offer choices within structure before diving into fully open-ended projects</li>
                <li><strong>Model the process</strong> - Show your own creative attempts, including the messy middle</li>
                <li><strong>Celebrate effort over product</strong> - Focus on the thinking and learning, not artistic skill</li>
                <li><strong>Provide inspiration, not templates</strong> - Show examples but encourage unique interpretations</li>
                <li><strong>Remove performance pressure</strong> - Make it clear that creative work is for learning, not grading</li>
              </ul>

              <h2 className="text-3xl font-bold mt-12">The Long-Term Benefits</h2>
              <p>
                Students who have regular opportunities for creative expression don't just learn content better—they develop broader capabilities:
              </p>
              <ul className="space-y-2">
                <li>Innovation and original thinking</li>
                <li>Confidence to try new approaches</li>
                <li>Resilience when first attempts don't succeed</li>
                <li>Ability to see connections across disciplines</li>
                <li>Intrinsic motivation to learn and create</li>
              </ul>

              <h2 className="text-3xl font-bold mt-12">How SmartCore Supports Creative Learning</h2>
              <p>
                Our platform recognizes that creativity isn't separate from academics—it's integral to deep learning:
              </p>
              <ul className="space-y-3">
                <li><strong>Open-ended project options</strong> allow students to demonstrate mastery through various creative forms</li>
                <li><strong>Discussion phases</strong> encourage original thinking and personal interpretation</li>
                <li><strong>Flexible assessments</strong> value creativity and critical thinking alongside accuracy</li>
                <li><strong>Project-based learning</strong> integrates arts and academics naturally</li>
              </ul>

              <h2 className="text-3xl font-bold mt-12">Beyond the False Choice</h2>
              <p>
                The debate between "rigorous academics" and "creative learning" is a false dichotomy. The best education doesn't choose between them—it recognizes that creativity and rigor enhance each other.
              </p>

              <p>
                When students have space to create, play, and explore—they don't just become more creative. They become better thinkers.
              </p>

              <div className="mt-12 p-6 bg-primary/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Ready to Integrate Creativity and Rigor?</h3>
                <p className="mb-4">
                  SmartCore provides the structure for academic mastery while leaving room for creative expression and exploration.
                </p>
                <Button size="lg" onClick={() => navigate('/auth')}>
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