import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';

export default function DyslexiaSupport() {
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
                <Badge variant="secondary">Accessibility</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  January 10, 2025
                </span>
                <span className="text-sm text-muted-foreground">• 9 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Reading Shouldn't Be a Barrier to Learning: How SmartCore Supports Dyslexic Students
              </h1>
            </div>

            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                Dyslexic students are often brilliant thinkers trapped behind a reading barrier. When we remove that barrier with technology, their true intelligence shines through.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Reading Ceiling</h2>
              <p>
                Here's a heartbreaking reality: many dyslexic students are reading 3-4 grade levels below their intellectual capability. They understand complex concepts when explained verbally, but traditional schoolwork requires reading—lots of it.
              </p>

              <p>
                The result? Brilliant kids who:
              </p>
              <ul className="space-y-2">
                <li>Ace oral tests but fail written ones</li>
                <li>Love science documentaries but can't pass science class</li>
                <li>Think deeply about history but can't read the textbook</li>
                <li>Have incredible ideas but struggle to write them down</li>
              </ul>

              <p>
                Traditional education punishes dyslexia as if reading speed equals intelligence. It doesn't. But without accommodations, dyslexic students get left behind—not because they can't learn, but because they can't access the material.
              </p>

              <h2 className="text-2xl font-bold mt-8">How SmartCore Levels the Playing Field</h2>

              <h3 className="text-xl font-bold mt-6">1. Universal Text-to-Speech</h3>
              <p>
                Every single piece of text on the platform can be read aloud with high-quality text-to-speech. Assignment instructions, learning materials, questions, feedback—everything. Students can choose to have text read automatically or click a button to hear specific sections.
              </p>

              <p>
                This isn't a special accommodation that singles students out. It's built into the interface for everyone. No stigma, no asking for help, no feeling different.
              </p>

              <h3 className="text-xl font-bold mt-6">2. Dyslexia-Friendly Fonts</h3>
              <p>
                The platform offers OpenDyslexic and other dyslexia-friendly font options. These fonts are designed with weighted bottoms and unique letter shapes that reduce letter-swapping and improve reading fluency. Students can customize font size, spacing, and color contrast for their specific needs.
              </p>

              <h3 className="text-xl font-bold mt-6">3. Speech-to-Text for All Responses</h3>
              <p>
                Dyslexic students often have sophisticated thoughts they struggle to write. Our speech-to-text feature allows them to speak their answers, which the AI transcribes and even cleans up for grammar and spelling. They're graded on their thinking, not their typing.
              </p>

              <h3 className="text-xl font-bold mt-6">4. Visual and Video-Based Learning</h3>
              <p>
                When the AI generates curriculum, it prioritizes video explanations and visual diagrams for students who've indicated dyslexia. They can learn the same concepts without reading-heavy materials.
              </p>

              <h3 className="text-xl font-bold mt-6">5. Bionic Reading Mode</h3>
              <p>
                This optional feature bolds the first few letters of each word, creating "fixation points" that help dyslexic readers' eyes track more efficiently. Research shows it can significantly improve reading speed and comprehension for many dyslexic readers.
              </p>

              <h3 className="text-xl font-bold mt-6">6. Reading Ruler Tool</h3>
              <p>
                A customizable on-screen ruler helps students track lines of text without losing their place—a common dyslexia frustration. The ruler can be any color and opacity that works for them.
              </p>

              <h2 className="text-2xl font-bold mt-8">Untimed Assessments</h2>
              <p>
                Reading speed and processing speed are not measures of intelligence. Our diagnostics and mastery assessments are never timed. Students work at their own pace, accessing text-to-speech as needed, without penalty.
              </p>

              <p>
                This is huge. Timed reading tests don't measure what dyslexic students know—they measure reading speed. When you remove the timer, suddenly these students can demonstrate their actual knowledge.
              </p>

              <h2 className="text-2xl font-bold mt-8">Multi-Modal Content Delivery</h2>
              <p>
                Every lesson can be accessed through:
              </p>
              <ul className="space-y-2">
                <li><strong>Reading:</strong> Traditional text with dyslexia supports</li>
                <li><strong>Listening:</strong> Text-to-speech or generated audio explanations</li>
                <li><strong>Watching:</strong> Video content and visual demonstrations</li>
                <li><strong>Doing:</strong> Hands-on project prompts and kinesthetic activities</li>
              </ul>

              <p>
                Students choose their preferred input mode. The AI tracks that they learned the standard—it doesn't care how they accessed the information.
              </p>

              <h2 className="text-2xl font-bold mt-8">Writing Support Without Shame</h2>
              <p>
                Writing is often even harder than reading for dyslexic students. Spelling, grammar, letter formation, organizing thoughts on paper—it's exhausting.
              </p>

              <p>
                Our AI writing assistant:
              </p>
              <ul className="space-y-2">
                <li>Fixes spelling and grammar automatically without marking them wrong</li>
                <li>Suggests organizational structures for essays</li>
                <li>Allows voice-to-text drafting with AI cleanup</li>
                <li>Provides graphic organizers that reduce working memory load</li>
              </ul>

              <p>
                The goal isn't to hide dyslexia—it's to assess thinking and learning, not mechanical writing skills.
              </p>

              <h2 className="text-2xl font-bold mt-8">AI That Understands Context</h2>
              <p>
                When grading open-response questions, the AI recognizes common dyslexia patterns:
              </p>
              <ul className="space-y-2">
                <li>Letter reversals (b/d, p/q)</li>
                <li>Phonetic spelling that shows understanding</li>
                <li>Word order issues that don't affect meaning</li>
                <li>Homophones (their/there/they're)</li>
              </ul>

              <p>
                It grades based on conceptual understanding, not spelling precision. A science answer with five spelling errors but correct thinking? Full credit.
              </p>

              <h2 className="text-2xl font-bold mt-8">Parent Dashboard: Track True Progress</h2>
              <p>
                Parents can see what their dyslexic child is actually learning—not just how many words they read per minute. The dashboard shows:
              </p>
              <ul className="space-y-2">
                <li>Standards mastered (the real goal)</li>
                <li>Content accessed through different modalities</li>
                <li>Time spent learning vs. time spent fighting reading barriers</li>
                <li>Areas of strength that might be hidden in traditional settings</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">What Parents of Dyslexic Students Tell Us</h2>
              <p>
                "For the first time, I can see how smart my daughter actually is. When reading isn't the gatekeeper, she's a straight-A student."
              </p>

              <p>
                "He went from hating school to asking for more assignments. Text-to-speech removed the barrier, and suddenly he's curious again."
              </p>

              <p>
                "The AI catches her understanding even when her spelling is a mess. Finally, she's being assessed on what she knows instead of how she writes it."
              </p>

              <h2 className="text-2xl font-bold mt-8">Dyslexia Is Not a Learning Disability</h2>
              <p>
                Let's be clear: dyslexia is a <em>reading</em> challenge, not a <em>learning</em> challenge. Many dyslexic individuals are gifted thinkers, creative problem-solvers, and systems thinkers.
              </p>

              <p>
                The problem isn't the student. The problem is an educational system that gates all learning behind reading and writing—the exact skills dyslexia impacts.
              </p>

              <p>
                Remove those barriers with technology, and dyslexic students thrive.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Bottom Line</h2>
              <p>
                Your dyslexic child is not struggling because they can't learn. They're struggling because traditional education insists on one input method—reading—and one output method—writing.
              </p>

              <p>
                SmartCore offers infinite input options and flexible output options. We assess understanding, not reading speed.
              </p>

              <p className="text-xl font-semibold">
                When you remove the barrier, the brilliant student emerges.
              </p>

              <div className="border-t pt-8 mt-12">
                <p className="text-muted-foreground italic">
                  Ready to see your dyslexic learner succeed?
                </p>
                <Button 
                  size="lg" 
                  className="mt-4"
                  onClick={() => navigate('/auth')}
                >
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
