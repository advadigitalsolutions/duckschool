import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';
import studentHeadphones from '@/assets/blog/student-learning-headphones.jpg';

export default function MasteryBasedLearning() {
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
                <Badge variant="secondary">Educational Research</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  January 10, 2025
                </span>
                <span className="text-sm text-muted-foreground">• 10 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                The Science Behind Mastery-Based Learning: Why It Works Better Than Traditional Education
              </h1>
            </div>
            <img 
              src={studentHeadphones} 
              alt="Student engaged in personalized mastery-based learning" 
              className="w-full h-[400px] object-cover rounded-lg"
            />
            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                Research shows mastery-based learning produces better outcomes than time-based education. Here's the neuroscience and data that proves it—and how Masterymode.ai implements it.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Problem with Time-Based Learning</h2>
              <p>
                Traditional education operates on a simple (but flawed) premise: All students should learn the same material in the same amount of time. Spend 45 minutes on fractions on Tuesday. Take a test on Friday. Score 73%? Good enough—time to move on to decimals.
              </p>
              <p>
                The result? Most students have Swiss cheese knowledge—full of holes that compound over time. That 73% on fractions becomes a 65% on decimals, which becomes a 52% on percentages, which becomes "I'm just not a math person."
              </p>

              <h2 className="text-2xl font-bold mt-8">What is Mastery-Based Learning?</h2>
              <p>
                Mastery-based learning flips the equation: <strong>Time becomes the variable, mastery becomes the constant.</strong>
              </p>
              <p>
                Instead of moving all students through content at the same pace, mastery-based systems require students to demonstrate deep understanding before advancing. A student might spend two days on fractions or two weeks—whatever it takes to truly master the concept.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Research Evidence</h2>
              
              <h3 className="text-xl font-semibold mt-6">Bloom's 2 Sigma Problem (1984)</h3>
              <p>
                Educational psychologist Benjamin Bloom found that students in mastery-based learning with one-on-one tutoring performed <strong>two standard deviations better</strong> than students in traditional classrooms. That means the average mastery-based student performed better than 98% of traditional students.
              </p>
              <p>
                The problem? One-on-one tutoring doesn't scale. Until now.
              </p>

              <h3 className="text-xl font-semibold mt-6">The Spacing Effect</h3>
              <p>
                Neuroscience research shows that distributed practice over time (spaced repetition) produces significantly better long-term retention than massed practice (cramming). Mastery-based systems naturally incorporate spacing by revisiting concepts until they're fully mastered.
              </p>

              <h3 className="text-xl font-semibold mt-6">Growth Mindset Research</h3>
              <p>
                Carol Dweck's work shows that students who believe ability can be developed through effort perform better than those who see ability as fixed. Mastery-based learning reinforces growth mindset by making progress visible and achievable—you <em>will</em> master this, it's just a matter of when.
              </p>

              <h3 className="text-xl font-semibold mt-6">The Testing Effect</h3>
              <p>
                Cognitive science demonstrates that retrieval practice (testing) is more effective for long-term learning than re-reading or re-listening. Mastery-based systems use frequent low-stakes assessments not for grades, but to strengthen memory and identify gaps.
              </p>

              <h2 className="text-2xl font-bold mt-8">Why Traditional Education Persists</h2>
              <p>
                If mastery-based learning is so effective, why don't all schools use it? Three reasons:
              </p>
              <ul>
                <li><strong>Logistical complexity:</strong> Managing 30 students all at different points in the curriculum is nearly impossible for one teacher</li>
                <li><strong>Standardized pacing:</strong> Schools are organized around age-based grades and semester schedules</li>
                <li><strong>Assessment limitations:</strong> Frequent, adaptive assessment requires sophisticated diagnostics</li>
              </ul>
              <p>
                AI solves all three problems.
              </p>

              <h2 className="text-2xl font-bold mt-8">How Masterymode.ai Implements Mastery-Based Learning</h2>

              <h3 className="text-xl font-semibold mt-6">1. Adaptive Diagnostics</h3>
              <p>
                Our platform continuously assesses understanding through adaptive questions that adjust based on student responses. This isn't a test they can fail—it's a conversation that identifies exactly what they know and don't know.
              </p>

              <h3 className="text-xl font-semibold mt-6">2. Competency-Based Progression</h3>
              <p>
                Students don't move to the next concept until they've demonstrated mastery (typically 80-90% accuracy with conceptual understanding, not just procedural fluency). No more building on shaky foundations.
              </p>

              <h3 className="text-xl font-semibold mt-6">3. Spaced Repetition</h3>
              <p>
                Even after a concept is "mastered," the system automatically spirals back to it at optimal intervals. This prevents the classic "I learned this last year but forgot it all" problem.
              </p>

              <h3 className="text-xl font-semibold mt-6">4. Multiple Representations</h3>
              <p>
                True mastery means understanding a concept from multiple angles. Our AI presents concepts through visual, verbal, symbolic, and contextual representations—ensuring deep understanding, not just memorization.
              </p>

              <h3 className="text-xl font-semibold mt-6">5. Immediate Feedback</h3>
              <p>
                Research shows that immediate, specific feedback accelerates learning. Students know instantly whether their understanding is correct and receive targeted hints when they're stuck.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Neurological Basis</h2>
              <p>
                When we learn something new, we're building neural pathways. Mastery-based learning strengthens these pathways through:
              </p>
              <ul>
                <li><strong>Myelination:</strong> Repeated practice builds myelin sheaths around neurons, making signals faster and more efficient</li>
                <li><strong>Consolidation:</strong> Spaced practice allows time for neural connections to consolidate in sleep</li>
                <li><strong>Elaboration:</strong> Connecting new knowledge to existing knowledge creates stronger, more accessible memories</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">Real Results</h2>
              <blockquote className="border-l-4 border-primary pl-4 italic my-6">
                "My son went from failing pre-algebra to scoring in the 95th percentile on standardized tests in one year. The difference? Masterymode.ai didn't let him move forward until he truly understood each concept. No more faking it."
                <footer className="text-sm mt-2">— Jennifer K., Texas homeschool parent</footer>
              </blockquote>

              <h2 className="text-2xl font-bold mt-8">Mastery vs. Memorization</h2>
              <p>
                It's important to distinguish mastery from mere memorization:
              </p>
              <ul>
                <li><strong>Memorization:</strong> "I can follow the steps to solve this type of problem"</li>
                <li><strong>Mastery:</strong> "I understand why these steps work and can adapt them to novel situations"</li>
              </ul>
              <p>
                Masterymode.ai tests for mastery through varied problem types, conceptual questions, and transfer tasks—not just procedural repetition.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Bottom Line</h2>
              <p>
                Decades of research in cognitive science, neuroscience, and education point to the same conclusion: Students learn better when they're required to master each concept before moving forward. The obstacle has always been implementation. AI removes that obstacle.
              </p>

              <div className="border-t pt-8 mt-12">
                <div className="bg-muted/50 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-3">Experience Mastery-Based Learning</h3>
                  <p className="mb-4">
                    Join Masterymode.ai and give your child an education based on proven science, not arbitrary time limits. Our platform ensures every student builds a rock-solid foundation before advancing—with AI handling all the complexity of personalized pacing, adaptive assessment, and spaced repetition.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Start with a free diagnostic assessment that shows you exactly where your child is and creates a personalized mastery-based learning path.
                  </p>
                </div>
                <Button size="lg" className="w-full" onClick={() => navigate('/auth')}>
                  Start Your Mastery-Based Journey
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
