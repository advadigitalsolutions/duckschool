import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';
import studentFocused from '@/assets/blog/student-focused-learning.jpg';

export default function BridgingLearningGaps() {
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
                <Badge variant="secondary">Academic Support</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  January 12, 2025
                </span>
                <span className="text-sm text-muted-foreground">• 8 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Bridging Learning Gaps: How AI Identifies and Fills Knowledge Holes
              </h1>
            </div>
            <img 
              src={studentFocused} 
              alt="Student engaged in focused learning with technology" 
              className="w-full h-[400px] object-cover rounded-lg"
            />
            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                Your child struggles with fractions but you're not sure why. AI diagnostics pinpoint the exact prerequisite skills they're missing and generate targeted lessons to fill those gaps.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Hidden Problem</h2>
              <p>
                A fifth grader can't multiply fractions. The traditional response? More fraction worksheets. But that's treating the symptom, not the cause.
              </p>
              <p>
                The real problem might be that they never fully mastered:
              </p>
              <ul>
                <li>Understanding fractions as parts of a whole</li>
                <li>Equivalent fractions and simplification</li>
                <li>Basic multiplication facts</li>
                <li>The relationship between multiplication and area models</li>
              </ul>
              <p>
                No amount of fraction multiplication practice will help if these foundational concepts are shaky.
              </p>

              <h2 className="text-2xl font-bold mt-8">How AI Finds the Gaps</h2>
              <p>
                SmartCore uses diagnostic branching to trace learning gaps back to their root cause:
              </p>
              
              <h3 className="text-xl font-semibold mt-6">1. Initial Assessment</h3>
              <p>
                When a student struggles with a concept, the AI doesn't just mark it wrong—it investigates. What prerequisite skills does this concept require?
              </p>

              <h3 className="text-xl font-semibold mt-6">2. Prerequisite Testing</h3>
              <p>
                The system automatically generates targeted questions to test each prerequisite. This happens adaptively—if a student demonstrates mastery of a skill, the system moves on. If not, it digs deeper.
              </p>

              <h3 className="text-xl font-semibold mt-6">3. Gap Mapping</h3>
              <p>
                The AI creates a visual map showing:
              </p>
              <ul>
                <li><strong className="text-green-600">Green skills:</strong> Fully mastered</li>
                <li><strong className="text-yellow-600">Yellow skills:</strong> Partial understanding</li>
                <li><strong className="text-red-600">Red skills:</strong> Significant gaps</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">4. Targeted Intervention</h3>
              <p>
                Instead of marching forward with grade-level curriculum, SmartCore automatically generates lessons to fill identified gaps—starting with the deepest foundational issues and working forward.
              </p>

              <h2 className="text-2xl font-bold mt-8">Real Example: The Fraction Mystery</h2>
              <p>
                Nine-year-old Marcus was "bad at math." His parents hired tutors, bought workbooks, watched YouTube videos—nothing worked. Traditional assessments said he was "on grade level" (because he could pass multiple-choice tests by guessing).
              </p>
              <p>
                SmartCore's diagnostic revealed:
              </p>
              <ul>
                <li>Strong number sense and pattern recognition</li>
                <li>Solid understanding of whole number operations</li>
                <li><strong>Critical gap:</strong> Never understood that fractions represent division</li>
              </ul>
              <p>
                This one conceptual gap cascaded into struggles with:
              </p>
              <ul>
                <li>Fraction-decimal conversions</li>
                <li>Percentages</li>
                <li>Ratios and proportions</li>
                <li>Division of multi-digit numbers</li>
              </ul>
              <p>
                Six weeks of targeted intervention on that single concept unlocked everything else. He's now accelerating through pre-algebra.
              </p>

              <h2 className="text-2xl font-bold mt-8">Why Traditional Methods Miss This</h2>
              <p>
                Standardized tests check if a student can perform a procedure. They don't check if the student understands <em>why</em> the procedure works or what foundational concepts it builds on.
              </p>
              <p>
                A child can memorize "cross multiply and divide" for fraction division without understanding what division means, what fractions represent, or why the procedure works. Then when they hit algebra, it all falls apart.
              </p>

              <h2 className="text-2xl font-bold mt-8">The SmartCore Difference</h2>
              <p>
                Our platform doesn't just identify gaps—it automatically creates the learning pathway to fill them:
              </p>
              <ul>
                <li><strong>Diagnostic branching</strong> traces problems to their root cause</li>
                <li><strong>Adaptive lessons</strong> generated specifically for your child's gaps</li>
                <li><strong>Continuous monitoring</strong> ensures gaps don't reappear</li>
                <li><strong>Standards alignment</strong> keeps learning on track while filling gaps</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">Stop Guessing. Start Knowing.</h2>
              <p>
                When you sign up for SmartCore, here's what happens:
              </p>
              <ol>
                <li><strong>Comprehensive diagnostic:</strong> Your child takes an adaptive assessment that identifies their exact skill level across all academic areas</li>
                <li><strong>Gap analysis:</strong> You receive a detailed report showing exactly which foundational skills are solid and which need reinforcement</li>
                <li><strong>Personalized curriculum:</strong> The system automatically generates a learning path that fills gaps while moving forward</li>
                <li><strong>Ongoing monitoring:</strong> Every assignment and assessment continuously refines the understanding of your child's knowledge</li>
              </ol>
              <p>
                No more wondering if your curriculum is working. No more surprises when your child hits a wall. Just clear data and a path forward.
              </p>

              <div className="border-t pt-8 mt-12">
                <div className="bg-muted/50 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-3">Ready to Identify Your Child's Learning Gaps?</h3>
                  <p className="mb-4">
                    Sign up for SmartCore and get instant access to our comprehensive diagnostic assessment. In under an hour, you'll have a complete picture of your child's academic strengths and the specific gaps holding them back—with a personalized learning plan ready to go.
                  </p>
                </div>
                <Button size="lg" className="w-full" onClick={() => navigate('/auth')}>
                  Start Your Free Diagnostic Assessment
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
