import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';
import studentTablet from '@/assets/blog/happy-student-tablet.jpg';
import girlLearning from '@/assets/blog/girl-independent-learning.png';
import parentChildLearning from '@/assets/blog/parent-child-learning-together.webp';

export default function LearningDifferences() {
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
                <Badge variant="secondary">Special Education</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  January 5, 2025
                </span>
                <span className="text-sm text-muted-foreground">• 8 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                From Anxiety to Achievement: Supporting Students with Learning Differences
              </h1>
            </div>
            <img 
              src={studentTablet} 
              alt="Confident student engaged with tablet learning" 
              className="w-full h-[400px] object-cover rounded-lg"
            />
            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                Dyscalculia, dysgraphia, processing disorders—SmartCore's accessibility features and adaptive pacing turn learning differences into learning opportunities.
              </p>

              <h2 className="text-2xl font-bold mt-8">When "Just Try Harder" Isn't the Answer</h2>
              <p>
                Your child is bright. Their teachers say so. You know so. But homework that should take 20 minutes takes two hours. Simple math facts won't stick. Writing a paragraph feels like climbing Everest. Reading causes headaches and tears.
              </p>
              <p>
                Maybe they've been diagnosed: dyscalculia, dysgraphia, dyslexia, ADHD, auditory processing disorder, visual processing issues. Or maybe you just know something's different about how they learn—but you're not sure what or how to help.
              </p>
              <p>
                Traditional education offers three options, all inadequate:
              </p>
              <ul>
                <li><strong>Special education services:</strong> Often focused on minimum competency rather than excellence, with stigma attached</li>
                <li><strong>504/IEP accommodations:</strong> Extended time on tests doesn't address the underlying learning challenge</li>
                <li><strong>"Push through" mentality:</strong> Treating a learning difference like laziness damages self-esteem and creates learned helplessness</li>
              </ul>
              <p>
                Homeschooling offers the freedom to teach differently—but that assumes you know HOW to teach differently. Most curricula are designed for neurotypical learners and adapted poorly for differences.
              </p>

              <img 
                src={girlLearning} 
                alt="Student with learning differences thriving through technology-assisted learning" 
                className="w-full h-[400px] object-cover rounded-lg my-8"
              />

              <h2 className="text-2xl font-bold mt-8">What Learning Differences Actually Look Like</h2>
              
              <h3 className="text-xl font-semibold mt-6">Dyscalculia</h3>
              <ul>
                <li>Struggles to visualize numbers or understand number sense</li>
                <li>Difficulty with math facts despite extensive practice</li>
                <li>Gets lost in multi-step problems</li>
                <li>Can understand concepts but can't execute procedures</li>
                <li>Strong verbal reasoning but weak numerical reasoning</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">Dysgraphia</h3>
              <ul>
                <li>Physically painful or exhausting to write by hand</li>
                <li>Significant gap between verbal expression and written output</li>
                <li>Spelling difficulties despite strong reading skills</li>
                <li>Slow writing speed that prevents completing work</li>
                <li>Messy handwriting that obscures good ideas</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">Processing Disorders</h3>
              <ul>
                <li><strong>Auditory:</strong> Difficulty following verbal instructions, mishears words, struggles with phonics</li>
                <li><strong>Visual:</strong> Trouble with reading comprehension despite decoding fluently, loses place on page, difficulty with visual patterns</li>
                <li><strong>Processing speed:</strong> Understands material but needs more time to respond or complete tasks</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">ADHD Learning Impacts</h3>
              <ul>
                <li>Understands material but forgets to write it down or turn it in</li>
                <li>Struggles with organization and planning</li>
                <li>Difficulty sustaining attention on non-preferred tasks</li>
                <li>Needs movement or fidgeting to concentrate</li>
                <li>Hyperfocus on interests, difficulty shifting attention</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">How SmartCore Supports Learning Differences</h2>

              <h3 className="text-xl font-semibold mt-6">1. Multimodal Presentation</h3>
              <p>
                Every concept is presented through multiple pathways:
              </p>
              <ul>
                <li><strong>Text-to-speech:</strong> All written content can be read aloud (adjustable speed, high-quality voices)</li>
                <li><strong>Visual representations:</strong> Concepts shown through diagrams, animations, and manipulables</li>
                <li><strong>Video instruction:</strong> Concepts explained verbally with visual support</li>
                <li><strong>Interactive practice:</strong> Hands-on engagement with concepts, not just reading about them</li>
              </ul>
              <p>
                If your child has dyslexia, they can listen while reading along. If they have auditory processing issues, they can read and see diagrams. The AI doesn't assume one learning modality fits all.
              </p>

              <img 
                src={parentChildLearning} 
                alt="Parent supporting child with learning differences in adaptive learning environment" 
                className="w-full h-[400px] object-cover rounded-lg my-8"
              />

              <h3 className="text-xl font-semibold mt-6">2. Adaptive Pacing Without Pressure</h3>
              <p>
                Learning differences don't mean less capable—they mean needing a different pace or approach. SmartCore adjusts:
              </p>
              <ul>
                <li><strong>Time expectations:</strong> No arbitrary "this should take 20 minutes." Work until mastery is achieved.</li>
                <li><strong>Problem quantity:</strong> If a student demonstrates mastery in 5 problems, they don't have to grind through 25 more</li>
                <li><strong>Complexity progression:</strong> Concepts are broken into smaller steps when needed</li>
                <li><strong>Review frequency:</strong> Material is revisited more often for students who need spaced repetition</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">3. Executive Function Scaffolding</h3>
              <p>
                Many learning differences come with executive function challenges. SmartCore provides the organizational structure students need:
              </p>
              <ul>
                <li><strong>Clear daily agenda:</strong> Student logs in and knows exactly what to do</li>
                <li><strong>Built-in breaks:</strong> System suggests movement breaks and incorporates them into scheduling</li>
                <li><strong>Progress visualization:</strong> Students see what they've accomplished and what's next</li>
                <li><strong>Checklists and reminders:</strong> No need to remember what subjects to do or in what order</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">4. Reduced Cognitive Load</h3>
              <p>
                Students with learning differences often experience cognitive overwhelm. The platform reduces this by:
              </p>
              <ul>
                <li><strong>One question at a time:</strong> Not a worksheet with 30 problems causing visual overwhelm</li>
                <li><strong>Clean interfaces:</strong> Minimal distractions, clear focus on the task at hand</li>
                <li><strong>Immediate feedback:</strong> Students know if they're on track without waiting</li>
                <li><strong>Progressive hints:</strong> Support is available without giving away answers</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">5. Strength-Based Identification</h3>
              <p>
                The diagnostic doesn't just identify weaknesses—it highlights strengths:
              </p>
              <ul>
                <li>Strong verbal reasoning? Concepts introduced through language</li>
                <li>Visual-spatial strengths? Diagrams and manipulables are emphasized</li>
                <li>Pattern recognition? Problems structured to leverage this ability</li>
                <li>Creative thinking? Open-ended questions incorporated regularly</li>
              </ul>
              <p>
                Students with learning differences often have significant strengths that get overshadowed by their struggles. The AI identifies and leverages these strengths in instruction.
              </p>

              <h2 className="text-2xl font-bold mt-8">Real Impact: From Anxiety to Achievement</h2>
              <blockquote className="border-l-4 border-primary pl-4 italic my-6">
                "My daughter has dysgraphia and ADHD. Writing a single paragraph would end in tears. SmartCore lets her verbally discuss ideas, then type responses (which is easier than handwriting), and breaks assignments into small chunks. She went from avoiding writing entirely to voluntarily working on her autobiography project. The AI paces everything to her abilities, so she's challenged but not overwhelmed."
                <footer className="text-sm mt-2">— Michael R., Oregon, father of 12-year-old with learning differences</footer>
              </blockquote>

              <blockquote className="border-l-4 border-primary pl-4 italic my-6">
                "Dyscalculia made traditional math curricula torture for my son. He'd understand concepts but couldn't do the algorithms. SmartCore uses multiple representations—he can solve problems visually, then learn the procedures once he understands WHY they work. His confidence has completely transformed."
                <footer className="text-sm mt-2">— Amanda K., Virginia, homeschools child with dyscalculia</footer>
              </blockquote>

              <h2 className="text-2xl font-bold mt-8">Accessibility Features Built In</h2>
              <ul>
                <li><strong>Text-to-speech:</strong> Natural-sounding voices, adjustable speed, word highlighting</li>
                <li><strong>Font options:</strong> Including dyslexia-friendly fonts</li>
                <li><strong>Color customization:</strong> Adjust contrast and background colors</li>
                <li><strong>Reading ruler:</strong> Isolates lines of text to reduce visual distraction</li>
                <li><strong>Keyboard navigation:</strong> Full accessibility for students who struggle with mouse control</li>
                <li><strong>Extended response time:</strong> No time pressure on problem completion</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">What This Means for Your Child</h2>
              <p>
                With SmartCore, your child with learning differences can:
              </p>
              <ul>
                <li><strong>Learn at grade level or above:</strong> Learning differences don't mean settling for less rigorous education</li>
                <li><strong>Build genuine mastery:</strong> Not just passing tests, but truly understanding concepts</li>
                <li><strong>Work independently:</strong> Scaffolding and support are built into the platform</li>
                <li><strong>Develop confidence:</strong> Success builds on success rather than repeated frustration</li>
                <li><strong>Discover strengths:</strong> Learning differences often come with significant gifts—the AI helps identify and develop these</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">You Don't Need to Be an Expert</h2>
              <p>
                One of the biggest homeschool fears: "I don't know how to teach a child with dyscalculia/dyslexia/ADHD/processing issues."
              </p>
              <p>
                With SmartCore, you don't need specialized training. The system applies evidence-based strategies automatically:
              </p>
              <ul>
                <li>Orton-Gillingham principles for dyslexia</li>
                <li>Multi-sensory math for dyscalculia</li>
                <li>Executive function support for ADHD</li>
                <li>Reduced cognitive load for processing disorders</li>
              </ul>
              <p>
                You provide the encouragement, relationship, and oversight. The AI provides the specialized instruction.
              </p>

              <div className="border-t pt-8 mt-12">
                <div className="bg-muted/50 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-3">Turn Learning Differences into Learning Opportunities</h3>
                  <p className="mb-4">
                    Sign up for SmartCore and give your child with learning differences the adaptive, multimodal, strength-based education they deserve. Our platform provides text-to-speech, visual representations, executive function scaffolding, and adaptive pacing that adjusts to your child's needs—without requiring you to become a special education expert.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    During the diagnostic assessment, the system identifies not just gaps but also learning strengths and preferences. Instruction is then personalized to leverage your child's strengths while providing targeted support for challenges. Built-in accessibility features and executive function scaffolding help your child work independently and build confidence.
                  </p>
                  <p className="text-sm font-medium">
                    Watch anxiety transform into achievement as your child finally experiences learning that works with their brain, not against it.
                  </p>
                </div>
                <Button size="lg" className="w-full" onClick={() => navigate('/auth')}>
                  Start Accessible, Adaptive Learning
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
