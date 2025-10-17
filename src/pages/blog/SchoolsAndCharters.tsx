import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';

export default function SchoolsAndCharters() {
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
                <Badge variant="secondary">Scaling Education</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  January 3, 2025
                </span>
                <span className="text-sm text-muted-foreground">• 9 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Scaling Personalized Learning: How Masterymode.ai Serves Private Schools, Charters, and Pods
              </h1>
            </div>

            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                Personalized, AI-powered education isn't just for homeschoolers. Discover how schools are using Masterymode.ai to differentiate instruction at scale—without hiring 100 teachers.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Differentiation Impossibility</h2>
              <p>
                Every educator knows: students in the same classroom are rarely at the same level. In a typical 25-student class, you might have:
              </p>
              <ul className="space-y-2">
                <li>5 students reading 2+ grades ahead</li>
                <li>8 students at grade level</li>
                <li>7 students 1-2 grades behind</li>
                <li>5 students with IEPs requiring specific accommodations</li>
              </ul>

              <p>
                Teachers are expected to differentiate for all of them. But with 6 classes and 150 students? It's physically impossible to create 150 personalized learning plans.
              </p>

              <p>
                So most teachers teach to the middle and hope for the best. Advanced students get bored. Struggling students fall further behind. Everyone loses.
              </p>

              <h2 className="text-2xl font-bold mt-8">How Schools Are Using Masterymode.ai</h2>

              <h3 className="text-xl font-bold mt-6">1. Microschools & Learning Pods (5-15 Students)</h3>
              <p>
                Small educational environments are exploding in popularity. A single teacher facilitates 10 mixed-age students. With Masterymode.ai:
              </p>
              <ul className="space-y-2">
                <li>Each student gets personalized curriculum auto-generated daily</li>
                <li>Teacher monitors progress dashboards instead of creating lesson plans</li>
                <li>Multi-age grouping works because everyone's on their own path</li>
                <li>One facilitator can genuinely support true differentiation</li>
              </ul>

              <div className="bg-muted/50 rounded-lg p-6 my-6">
                <p className="font-semibold">Real Example: Denver Microschool</p>
                <p className="text-muted-foreground mt-2">
                  12 students, ages 9-13, one teacher. Each student works through math at their own level while teacher provides small-group instruction based on AI-identified needs. All students progressed an average of 1.5 grade levels in reading within one semester.
                </p>
              </div>

              <h3 className="text-xl font-bold mt-6">2. Private Schools (Small Class Sizes)</h3>
              <p>
                Private schools promise differentiation but often can't deliver it at scale. Masterymode.ai becomes:
              </p>
              <ul className="space-y-2">
                <li><strong>Intervention support:</strong> Struggling students get AI-generated remedial work</li>
                <li><strong>Enrichment platform:</strong> Advanced students access challenge material automatically</li>
                <li><strong>Homework system:</strong> Personalized assignments that actually match student level</li>
                <li><strong>Summer bridge programs:</strong> Prevent summer slide with adaptive content</li>
              </ul>

              <h3 className="text-xl font-bold mt-6">3. Charter Schools (Flexibility with Accountability)</h3>
              <p>
                Charters have autonomy to innovate but must still show standards mastery. Masterymode.ai provides:
              </p>
              <ul className="space-y-2">
                <li>Standards alignment for state testing prep</li>
                <li>Data dashboards showing progress toward benchmarks</li>
                <li>Ability to scale personalized learning school-wide</li>
                <li>Reduced teacher burnout through AI assistance</li>
              </ul>

              <p>
                Several charter networks are piloting Duckschool as their core academic platform, allowing teachers to focus on mentorship and social-emotional learning while AI handles content delivery.
              </p>

              <h3 className="text-xl font-bold mt-6">4. Hybrid Homeschool Co-ops</h3>
              <p>
                Students meet 2-3 days per week for group activities, then work independently at home. Duckschool:
              </p>
              <ul className="space-y-2">
                <li>Generates individualized assignments for home days</li>
                <li>Allows teachers to focus in-person time on discussion and projects</li>
                <li>Tracks progress across both settings</li>
                <li>Coordinates curriculum so home and co-op work complement each other</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">The Teacher's Role Transforms</h2>
              <p>
                Teachers aren't replaced—they're elevated. Instead of:
              </p>
              <ul className="space-y-2">
                <li>Planning 5 different lessons per day</li>
                <li>Grading 150 papers by hand</li>
                <li>Creating differentiated homework packets</li>
                <li>Tracking standards in spreadsheets</li>
              </ul>

              <p>
                They focus on:
              </p>
              <ul className="space-y-2">
                <li>Small group instruction based on AI-identified needs</li>
                <li>One-on-one mentorship and relationship building</li>
                <li>Facilitating projects and discussions</li>
                <li>Social-emotional learning and community building</li>
              </ul>

              <p>
                The AI handles content delivery and assessment. Teachers handle the human elements that actually require human expertise.
              </p>

              <h2 className="text-2xl font-bold mt-8">Supplementing Public Schools</h2>
              <p>
                Public school families are using Duckschool as:
              </p>

              <h3 className="text-xl font-bold mt-6">After-School Enrichment</h3>
              <p>
                Gifted students who finish classwork early get challenging extension activities at home. The AI picks up where school left off, ensuring continuous progress.
              </p>

              <h3 className="text-xl font-bold mt-6">Intervention Support</h3>
              <p>
                Students struggling in school get targeted remediation at home. Parents no longer need to hire expensive tutors—the AI identifies gaps and fills them systematically.
              </p>

              <h3 className="text-xl font-bold mt-6">Summer Programs</h3>
              <p>
                Prevent summer slide or get ahead. Students work through personalized curriculum during break, coming back to school ready rather than rusty.
              </p>

              <h2 className="text-2xl font-bold mt-8">Pricing and Pilot Programs</h2>
              <p>
                For schools and organizations, we offer:
              </p>
              <ul className="space-y-2">
                <li><strong>Microschool pricing:</strong> Discounted rates for 5-15 student groups</li>
                <li><strong>School licenses:</strong> Per-student pricing that scales</li>
                <li><strong>Pilot programs:</strong> Free trial periods for schools testing the platform</li>
                <li><strong>Professional development:</strong> Teacher training on AI-assisted instruction</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">Data Privacy and Compliance</h2>
              <p>
                Schools need FERPA-compliant systems. Duckschool provides:
              </p>
              <ul className="space-y-2">
                <li>FERPA and COPPA compliant data handling</li>
                <li>School admin dashboards for oversight</li>
                <li>Secure student data with parental controls</li>
                <li>Export capabilities for state reporting requirements</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">What Educators Tell Us</h2>
              <p>
                "I thought AI would replace teachers. Instead, it gave me back the time to actually <em>teach</em>—to have real conversations, to mentor, to inspire. The AI handles the grind; I handle the relationship."
              </p>

              <p>
                "Our microschool has 8 students across 3 grade levels. Before Duckschool, I was drowning in lesson planning. Now each kid gets personalized curriculum, and I facilitate rather than lecture."
              </p>

              <p>
                "As a charter school principal, I was skeptical of AI. But our state testing scores improved by 23% in one year. Teachers are happier, students are more engaged, and we're actually delivering on our differentiation promise."
              </p>

              <h2 className="text-2xl font-bold mt-8">Scaling Beyond Homeschool</h2>
              <p>
                Duckschool started with homeschool families—and that remains our core. But the technology scales beautifully to:
              </p>
              <ul className="space-y-2">
                <li>Microschools and pods</li>
                <li>Private schools seeking differentiation</li>
                <li>Charter schools with innovation mandates</li>
                <li>Hybrid and flex schools</li>
                <li>After-school programs</li>
                <li>Tutoring centers</li>
              </ul>

              <p>
                Anywhere educators want to deliver truly personalized learning at scale, Duckschool makes it possible.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Bottom Line</h2>
              <p>
                Personalized learning has been an educational buzzword for decades—aspirational but impossible at scale. AI changes everything. For the first time, schools can actually deliver differentiated, standards-aligned, responsive instruction to every student.
              </p>

              <p className="text-xl font-semibold">
                Not as a promise. As a reality.
              </p>

              <div className="border-t pt-8 mt-12">
                <p className="text-muted-foreground italic">
                  Interested in bringing Duckschool to your school or pod?
                </p>
                <Button 
                  size="lg" 
                  className="mt-4"
                  onClick={() => navigate('/auth')}
                >
                  Request School Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
