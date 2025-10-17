import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';
import siblingsLearning from '@/assets/blog/siblings-silhouette.jpg';
import fatherTwoChildren from '@/assets/blog/father-two-children-laptop.jpg';
import tiredParent from '@/assets/blog/tired-parent-homeschool.jpeg';
import parentChildBonding from '@/assets/blog/parent-child-bonding.jpg';

export default function MultipleChildren() {
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
                <Badge variant="secondary">Multi-Child Homeschooling</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  January 8, 2025
                </span>
                <span className="text-sm text-muted-foreground">• 7 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Homeschooling Multiple Children: Managing Different Ages, Abilities, and Learning Styles
              </h1>
            </div>
            <img 
              src={siblingsLearning} 
              alt="Siblings learning together in homeschool environment" 
              className="w-full h-[400px] object-cover rounded-lg"
            />
            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                Teaching a kindergartener, fourth grader, and high schooler simultaneously? AI-powered personalization means each child gets exactly what they need without you multiplying yourself.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Multi-Child Homeschool Juggle</h2>
              <p>
                It's 9 AM. Your kindergartener needs help sounding out words. Your fourth grader is stuck on long division. Your high schooler just asked a chemistry question you haven't thought about since 1997.
              </p>
              <p>
                You're supposed to be teaching three different grade levels, in multiple subjects, with different learning styles and abilities—while also making lunch, answering emails, and pretending you have it all together.
              </p>
              <p>
                Traditional homeschool advice says: "Just use the same curriculum and adjust." But anyone who's tried that knows it doesn't work. A kindergartener can't sit through a high school history lesson. A teenager won't engage with primary-source analysis at a fourth-grade level.
              </p>

              <img 
                src={fatherTwoChildren} 
                alt="Father homeschooling multiple children with laptop" 
                className="w-full h-[400px] object-cover rounded-lg my-8"
              />

              <h2 className="text-2xl font-bold mt-8">The Real Challenge: It's Not Just Different Content</h2>
              <p>
                Managing multiple children isn't just about having different lesson plans. It's about:
              </p>
              <ul>
                <li><strong>Different developmental stages:</strong> Your 6-year-old needs movement breaks every 15 minutes. Your 14-year-old can focus for an hour.</li>
                <li><strong>Different learning styles:</strong> One child learns through discussion, another needs hands-on activities, another prefers reading independently.</li>
                <li><strong>Different emotional needs:</strong> Your confident reader doesn't understand why their sibling struggles. Your struggling learner feels defeated watching their sibling excel.</li>
                <li><strong>Different pacing:</strong> One child races through math but labors over writing. Another is the opposite.</li>
                <li><strong>Different interests:</strong> One wants to study ancient Egypt for three months. Another couldn't care less about pyramids.</li>
              </ul>
              <p>
                And you're supposed to orchestrate all of this—while also being patient, enthusiastic, and present for each child's individual needs.
              </p>

              <h2 className="text-2xl font-bold mt-8">Why Traditional Multi-Age Strategies Fall Short</h2>
              
              <h3 className="text-xl font-semibold mt-6">Unit Studies</h3>
              <p>
                "Just teach the same topic at different levels!" Sounds great in theory. In practice, you're creating three different lesson plans on the same topic, which is often more work than creating three completely different lessons. Plus, forcing every subject into thematic units gets contrived fast.
              </p>

              <h3 className="text-xl font-semibold mt-6">Workbox Systems</h3>
              <p>
                Color-coded boxes for each child with independent work. This helps with organization but doesn't solve the fundamental problem: You still need to create, source, and grade all that independent work. And younger children still need extensive support.
              </p>

              <h3 className="text-xl font-semibold mt-6">Morning Time / Circle Time</h3>
              <p>
                Gathering everyone for read-alouds, memory work, and hymn singing is lovely—for about 30 minutes. Then everyone still needs individualized instruction in math, writing, and reading.
              </p>

              <img 
                src={tiredParent} 
                alt="Tired parent managing homeschool with multiple children" 
                className="w-full h-[400px] object-cover rounded-lg my-8"
              />

              <h2 className="text-2xl font-bold mt-8">How AI Changes Everything</h2>
              <p>
                Masterymode.ai doesn't just provide different content for different ages. It creates genuinely personalized learning paths that adapt in real-time to each child's pace, style, and needs—while drastically reducing your planning and management burden.
              </p>

              <h3 className="text-xl font-semibold mt-6">1. Automated Differentiation</h3>
              <p>
                You don't create three lesson plans. The AI does. Each child gets:
              </p>
              <ul>
                <li>Content at their exact skill level (not just their grade level)</li>
                <li>Lessons in their preferred format (visual, auditory, kinesthetic, reading/writing)</li>
                <li>Pacing that adapts daily based on their progress</li>
                <li>Support scaffolding that increases or decreases based on their needs</li>
              </ul>
              <p>
                Example: Your 4th and 6th graders are both learning fractions, but one is working on basic equivalence while the other is doing operations with mixed numbers. Same general topic, completely different instruction—with no additional work from you.
              </p>

              <h3 className="text-xl font-semibold mt-6">2. True Independent Learning</h3>
              <p>
                Younger children need more support, but Masterymode.ai provides scaffolding that makes genuine independence possible earlier:
              </p>
              <ul>
                <li><strong>Text-to-speech:</strong> Non-readers can access content independently</li>
                <li><strong>Instructional videos:</strong> Concepts are taught before practice, so they're not constantly asking "How do I do this?"</li>
                <li><strong>Immediate feedback:</strong> They know right away if they're on track, instead of waiting for you to check their work</li>
                <li><strong>Built-in hints:</strong> Stuck? The system provides progressively detailed hints before giving the answer</li>
              </ul>
              <p>
                Your 2nd grader can actually work independently while you help your 10th grader with essay structure. Not because you're neglecting them, but because they have the support they need.
              </p>

              <h3 className="text-xl font-semibold mt-6">3. Smart Scheduling</h3>
              <p>
                The system looks at what each child needs to accomplish and creates a realistic daily schedule that:
              </p>
              <ul>
                <li>Blocks time when each child needs your direct attention</li>
                <li>Schedules independent work when you're helping someone else</li>
                <li>Balances subjects throughout the week based on each child's needs</li>
                <li>Adjusts when someone falls behind or races ahead</li>
              </ul>
              <p>
                You're not constantly firefighting or wondering who you're supposed to be helping when. The system orchestrates the logistics.
              </p>

              <img 
                src={parentChildBonding} 
                alt="Parent and child learning together in supportive environment" 
                className="w-full h-[400px] object-cover rounded-lg my-8"
              />

              <h3 className="text-xl font-semibold mt-6">4. Addressing Sibling Dynamics</h3>
              <p>
                Masterymode.ai reduces comparison and competition because:
              </p>
              <ul>
                <li><strong>Progress is individualized:</strong> Each child sees their own growth, not their ranking against siblings</li>
                <li><strong>Mastery-based advancement:</strong> Moving forward is about demonstrating understanding, not about being "ahead" of someone</li>
                <li><strong>Strengths are highlighted:</strong> The system identifies and celebrates what each child is good at</li>
                <li><strong>Struggles are private:</strong> Children aren't aware of what their siblings are working on unless you choose to share</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">Real Family Example</h2>
              <blockquote className="border-l-4 border-primary pl-4 italic my-6">
                "Before Masterymode.ai, I was spending 3-4 hours every evening planning for the next day. Now I spend maybe 20 minutes reviewing their progress and adjusting if needed. My 7-year-old, 10-year-old, and 13-year-old are all thriving at their own pace, and I'm not constantly playing referee or feeling guilty about whoever I'm not helping in that moment."
                <footer className="text-sm mt-2">— Sarah M., Michigan, homeschools 3 children</footer>
              </blockquote>

              <h2 className="text-2xl font-bold mt-8">What About Subjects You Want to Teach Together?</h2>
              <p>
                Masterymode.ai handles the subjects that need individualization (math, reading, writing). This frees you to enjoy teaching together:
              </p>
              <ul>
                <li>Science experiments everyone can participate in at their level</li>
                <li>History discussions where different ages contribute different insights</li>
                <li>Read-alouds that everyone enjoys</li>
                <li>Art projects adapted for different skill levels</li>
                <li>Field trips and nature walks</li>
              </ul>
              <p>
                You get to be the guide for enriching group activities instead of the stressed taskmaster trying to keep three different lesson plans moving forward.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Mental Load Reduction</h2>
              <p>
                Perhaps the biggest benefit isn't even the time saved—it's the mental space recovered. You're not constantly doing math in your head:
              </p>
              <ul>
                <li>"If Emma finishes her reading in 20 minutes, I can help Jake with his essay, but what will Lily do during that time?"</li>
                <li>"Did I remember to print Jake's worksheet? Did I prep Lily's science experiment? Does Emma have everything she needs?"</li>
                <li>"Why is Emma so far ahead in math but struggling with reading? Should I slow her down or get her more help?"</li>
              </ul>
              <p>
                The system manages the logistics. You get to focus on the actual teaching and relationships.
              </p>

              <h2 className="text-2xl font-bold mt-8">Getting Started with Multiple Children</h2>
              <p>
                When you sign up for Masterymode.ai:
              </p>
              <ol>
                <li><strong>Each child takes a diagnostic:</strong> The system assesses where each child is across all subjects (takes 30-60 minutes per child)</li>
                <li><strong>Personalized paths are created:</strong> Each child gets a custom learning plan based on their results</li>
                <li><strong>You get a master schedule:</strong> The system shows you a recommended daily schedule that coordinates all children</li>
                <li><strong>Learning begins:</strong> Each child logs in and knows exactly what to do. You get a parent dashboard showing everyone's progress</li>
                <li><strong>Ongoing adaptation:</strong> The system continuously adjusts based on how each child is doing</li>
              </ol>

              <div className="border-t pt-8 mt-12">
                <div className="bg-muted/50 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-3">Teach Multiple Children Without Multiplying Yourself</h3>
                  <p className="mb-4">
                    Sign up for Masterymode.ai and give each child personalized, adaptive learning at their exact level and pace. Our AI creates individualized lesson plans, provides scaffolded independent work, and generates smart schedules that coordinate multiple students—so you can stop juggling and start teaching.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    During setup, each child takes a comprehensive diagnostic that identifies their strengths, gaps, and learning preferences. The system then generates personalized learning paths and coordinates them into a realistic daily schedule that minimizes stress and maximizes learning for everyone.
                  </p>
                  <p className="text-sm font-medium">
                    Finally escape the multi-child chaos and create a homeschool that works for your whole family.
                  </p>
                </div>
                <Button size="lg" className="w-full" onClick={() => navigate('/auth')}>
                  Get Started with Multiple Students
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
