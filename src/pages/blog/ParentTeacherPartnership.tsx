import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';
import parentTeacherPartnership from '@/assets/blog/pexels-vanessa-loring-7869139.jpg';

export default function ParentTeacherPartnership() {
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
                <Badge variant="secondary">Parenting</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  December 12, 2024
                </span>
                <span className="text-sm text-muted-foreground">• 6 min read</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                The Parent-Teacher Partnership: Supporting Learning at Home and School
              </h1>
            </div>

            <img 
              src={parentTeacherPartnership} 
              alt="Parent and child learning together"
              className="w-full h-[400px] object-cover rounded-lg"
            />

            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                Whether you're homeschooling full-time, supplementing public school, or navigating hybrid education—your role as a parent in your child's learning is irreplaceable. But what does effective parent involvement actually look like?
              </p>

              <h2 className="text-3xl font-bold mt-12">Beyond Homework Supervision</h2>
              <p>
                Parent involvement isn't about micromanaging every worksheet or hovering during study time. It's about creating an environment where learning thrives and being the supportive guide your child needs.
              </p>

              <h3 className="text-2xl font-semibold mt-8">What Effective Parent Involvement Looks Like</h3>
              <ul className="space-y-3">
                <li><strong>Creating structure</strong> - Establishing routines that support focused learning time</li>
                <li><strong>Providing resources</strong> - Ensuring access to materials, technology, and learning tools</li>
                <li><strong>Being emotionally available</strong> - Offering encouragement during challenges and celebrating progress</li>
                <li><strong>Asking good questions</strong> - "What did you find interesting today?" rather than "Did you finish?"</li>
                <li><strong>Modeling curiosity</strong> - Demonstrating your own learning and growth</li>
              </ul>

              <h2 className="text-3xl font-bold mt-12">Different Models, Same Partnership</h2>
              <p>
                Your involvement looks different depending on your family's educational setup, but the core principles remain constant.
              </p>

              <h3 className="text-2xl font-semibold mt-8">Full-Time Homeschooling</h3>
              <p>
                As the primary educator, you're wearing multiple hats—curriculum designer, instructor, administrator, and cheerleader. The key is knowing when to teach directly and when to facilitate independent learning.
              </p>
              <p>
                <strong>Your role:</strong> Balance being present and available with fostering independence. Use diagnostic tools to identify what needs your direct instruction versus what your child can master independently with the right resources.
              </p>

              <h3 className="text-2xl font-semibold mt-8">Hybrid Schooling</h3>
              <p>
                Your child attends school part-time but learns at home the rest of the week. This requires coordination between what's happening at school and what you're reinforcing at home.
              </p>
              <p>
                <strong>Your role:</strong> Bridge school and home learning. Fill gaps, provide enrichment, and ensure consistency in expectations across both environments.
              </p>

              <h3 className="text-2xl font-semibold mt-8">Public School Supplementation</h3>
              <p>
                Your child attends traditional school, but you're providing additional support—either filling gaps or offering advanced challenges beyond what school provides.
              </p>
              <p>
                <strong>Your role:</strong> Complement what's happening at school without overwhelming your child. Target specific areas where they need extra help or deeper challenge.
              </p>

              <h2 className="text-3xl font-bold mt-12">Common Partnership Pitfalls</h2>
              <p>
                Even well-intentioned parents can fall into patterns that undermine learning. Here's what to avoid:
              </p>

              <h3 className="text-2xl font-semibold mt-8">Over-Involvement</h3>
              <p>
                Jumping in to solve every problem, completing assignments "together" (meaning you do most of it), or constant hovering that prevents independent problem-solving.
              </p>
              <p>
                <strong>Instead:</strong> Step back and let struggle happen. Ask "What have you tried?" and "What could you try next?" before offering solutions.
              </p>

              <h3 className="text-2xl font-semibold mt-8">Under-Involvement</h3>
              <p>
                Assuming that if you've provided resources and structure, learning will happen automatically without any adult engagement or awareness.
              </p>
              <p>
                <strong>Instead:</strong> Check in regularly. Review work not to criticize but to understand their thinking. Show genuine interest in what they're learning.
              </p>

              <h3 className="text-2xl font-semibold mt-8">Performance Pressure</h3>
              <p>
                Making every assignment about grades, test scores, or measuring up to external standards rather than actual learning and growth.
              </p>
              <p>
                <strong>Instead:</strong> Focus on mastery and progress. Celebrate effort, creative thinking, and persistence—not just correct answers.
              </p>

              <h2 className="text-3xl font-bold mt-12">The Technology Partnership</h2>
              <p>
                AI-powered learning platforms like SmartCore don't replace you—they amplify your ability to support learning effectively.
              </p>

              <h3 className="text-2xl font-semibold mt-8">How Technology Supports Your Role</h3>
              <ul className="space-y-3">
                <li><strong>Diagnostic insights</strong> show you exactly where your child needs support</li>
                <li><strong>Automated grading</strong> frees your time for meaningful conversations about learning</li>
                <li><strong>Personalized pacing</strong> allows you to trust the system while staying informed</li>
                <li><strong>Progress tracking</strong> helps you see patterns and growth over time</li>
              </ul>

              <h2 className="text-3xl font-bold mt-12">Building Trust in the Process</h2>
              <p>
                The strongest parent-learning partnerships are built on trust—trust in your child's capacity to learn, trust in yourself as a guide, and trust in the learning process itself.
              </p>

              <p>
                This means accepting that there will be:
              </p>
              <ul className="space-y-2">
                <li>Days when nothing seems to click</li>
                <li>Topics that take longer than expected</li>
                <li>Moments when you don't have all the answers</li>
                <li>Times when your child teaches you something</li>
              </ul>

              <p>
                All of this is normal, healthy, and part of real learning.
              </p>

              <h2 className="text-3xl font-bold mt-12">Your Unique Advantage</h2>
              <p>
                What you bring to your child's education that no teacher, tutor, or AI system ever can: deep knowledge of who they are, unwavering belief in their potential, and unconditional support through both triumphs and struggles.
              </p>

              <p>
                That's not something to minimize—it's your superpower.
              </p>

              <div className="mt-12 p-6 bg-primary/5 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Ready to Build a Stronger Learning Partnership?</h3>
                <p className="mb-4">
                  SmartCore helps you focus on what matters most—supporting your child—while handling the curriculum, grading, and diagnostic work.
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