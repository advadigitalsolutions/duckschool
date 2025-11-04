import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';

// Blog images
import studentLearningHeadphones from '@/assets/blog/student-learning-headphones.jpg';
import parentChildLearning from '@/assets/blog/parent-child-learning.jpg';
import childExploringRuins from '@/assets/blog/child-exploring-ruins.jpeg';
import girlIndependentLearning from '@/assets/blog/girl-independent-learning.png';
import studentFocusedLearning from '@/assets/blog/student-focused-learning.jpg';
import happyStudentTablet from '@/assets/blog/happy-student-tablet.jpg';
import busyFamily from '@/assets/blog/busy-family.jpg';
import portugalCityscape from '@/assets/blog/portugal-cityscape.jpg';
import parentChildBonding from '@/assets/blog/parent-child-bonding.jpg';
import modernReportCard from '@/assets/blog/modern-report-card.jpg';
import siblingSilhouette from '@/assets/blog/siblings-silhouette.jpg';
import homeschoolParentLaptop from '@/assets/blog/homeschool-parent-laptop.jpg';
import studentTakingNotes from '@/assets/blog/student-taking-notes.jpg';
import exhaustedParent from '@/assets/blog/exhausted-parent.webp';
import studentViolinPractice from '@/assets/blog/student-violin-practice.jpg';
import tiredParentHomeschool from '@/assets/blog/tired-parent-homeschool.jpeg';
import fatherTwoChildrenLaptop from '@/assets/blog/father-two-children-laptop.jpg';
import parentChildLearningTogether from '@/assets/blog/parent-child-learning-together.webp';
import vintageReportCard from '@/assets/blog/vintage-report-card.jpg';
// New blog images
import chessStrategy from '@/assets/blog/chess-strategy.jpg';
import girlReadingIndependently from '@/assets/blog/girl-reading-independently.jpg';
import happyLibraryStudent from '@/assets/blog/happy-library-student.jpg';
import coffeeStudySession from '@/assets/blog/coffee-study-session.jpg';
import studentStress from '@/assets/blog/student-stress.jpg';
import brainScience from '@/assets/blog/brain-science.jpg';
import thoughtfulLearner from '@/assets/blog/thoughtful-learner.jpg';
import libraryOverwhelm from '@/assets/blog/library-overwhelm.jpg';
import collaborativeLearning from '@/assets/blog/pexels-rethaferguson-3059750.jpg';
import techIntegration from '@/assets/blog/pexels-thisisengineering-3862130.jpg';
import parentTeacherPartnership from '@/assets/blog/pexels-vanessa-loring-7869139.jpg';
import creativeLearning from '@/assets/blog/pexels-cottonbro-6473097.jpg';
import familyHomeschool from '@/assets/blog/pexels-ron-lach-9783353.jpg';
import happyFamilyCouch from '@/assets/blog/happy-family-couch.jpg';

export default function Blog() {
  const navigate = useNavigate();

  const posts = [
    { slug: 'data-driven-curriculum', title: 'How to Choose the Right Homeschool Curriculum: A Data-Driven Approach', excerpt: 'Stop guessing and start knowing: AI-powered diagnostics reveal exactly where your child is, what they need, and how to get them there.', date: 'January 15, 2025', category: 'Curriculum Planning', readTime: '9 min read', image: studentLearningHeadphones },
    { slug: 'pedagogies-supported', title: 'One Platform, Every Pedagogy: How SmartCore Adapts to Your Teaching Philosophy', excerpt: 'From Montessori to Classical, Charlotte Mason to unschooling—discover how our AI-powered platform supports any approach.', date: 'January 15, 2025', category: 'Philosophy', readTime: '10 min read', image: parentChildLearning },
    { slug: 'student-burnout', title: 'Preventing Student Burnout: Recognizing Warning Signs and Creating Sustainable Learning', excerpt: 'Academic pressure without recovery leads to burnout. Learn to spot early signs and build a homeschool rhythm that protects mental health.', date: 'January 14, 2025', category: 'Student Wellbeing', readTime: '8 min read', image: studentStress },
    { slug: 'neuroscience-of-learning', title: 'The Neuroscience of Learning Differences: Understanding How Unique Brains Process Information', excerpt: 'Brain imaging reveals how dyslexic, ADHD, and autistic brains process information differently—and why traditional teaching often fails them.', date: 'January 13, 2025', category: 'Neuroscience', readTime: '10 min read', image: brainScience },
    { slug: 'bridging-learning-gaps', title: 'Bridging Learning Gaps: How AI Identifies and Fills Knowledge Holes', excerpt: 'Your child struggles with fractions but you\'re not sure why. AI diagnostics pinpoint the exact prerequisite skills they\'re missing.', date: 'January 12, 2025', category: 'Academic Support', readTime: '8 min read', image: childExploringRuins },
    { slug: 'adhd-support', title: 'Built for ADHD Brains: How SmartCore Turns Executive Function Challenges into Strengths', excerpt: 'ADHD brains are brilliantly wired for depth, creativity, and hyperfocus—when the environment supports them.', date: 'January 12, 2025', category: 'Neurodivergence', readTime: '8 min read', image: studentFocusedLearning },
    { slug: 'critical-thinking', title: 'Building Critical Thinking Skills: Moving Beyond Memorization to Deep Understanding', excerpt: 'Critical thinking isn\'t a subject—it\'s a habit of mind developed through thoughtful questions and real problem-solving.', date: 'January 11, 2025', category: 'Cognitive Skills', readTime: '9 min read', image: thoughtfulLearner },
    { slug: 'school-overwhelm', title: 'When School Feels Overwhelming: Supporting Students Through Academic Anxiety', excerpt: 'For sensitive learners, school overwhelm isn\'t about effort—it\'s about processing, pace, and environment. Here\'s how to help.', date: 'January 11, 2025', category: 'Mental Health', readTime: '7 min read', image: libraryOverwhelm },
    { slug: 'mastery-based-learning', title: 'The Science Behind Mastery-Based Learning: Why It Works Better Than Traditional Education', excerpt: 'Research shows mastery-based learning produces better outcomes. Here\'s the neuroscience and data that proves it.', date: 'January 10, 2025', category: 'Educational Research', readTime: '10 min read', image: chessStrategy },
    { slug: 'dyslexia-support', title: 'Reading Shouldn\'t Be a Barrier to Learning: How SmartCore Supports Dyslexic Students', excerpt: 'Dyslexic students are often brilliant thinkers trapped behind a reading barrier. When we remove it, they shine.', date: 'January 10, 2025', category: 'Accessibility', readTime: '9 min read', image: happyStudentTablet },
    { slug: 'multiple-children', title: 'Homeschooling Multiple Children: Managing Different Ages, Abilities, and Learning Styles', excerpt: 'Teaching a kindergartener, fourth grader, and high schooler simultaneously? AI personalization helps without multiplying yourself.', date: 'January 8, 2025', category: 'Multi-Child Homeschooling', readTime: '7 min read', image: siblingSilhouette },
    { slug: 'expat-families', title: 'World-Schooling Made Easy: How SmartCore Supports Expat and Traveling Families', excerpt: 'From Tokyo to Tanzania, maintain US educational standards while embracing the world as your classroom.', date: 'January 8, 2025', category: 'Lifestyle', readTime: '7 min read', image: portugalCityscape },
    { slug: 'learning-differences', title: 'From Anxiety to Achievement: Supporting Students with Learning Differences', excerpt: 'Dyscalculia, dysgraphia, processing disorders—SmartCore\'s accessibility features turn learning differences into opportunities.', date: 'January 5, 2025', category: 'Special Education', readTime: '8 min read', image: parentChildBonding },
    { slug: 'just-in-time-curriculum', title: 'Just-In-Time Curriculum: Teaching What Your Child Needs, Exactly When They Need It', excerpt: 'AI-powered learning delivers personalized instruction based on daily diagnostic data.', date: 'January 5, 2025', category: 'Innovation', readTime: '8 min read', image: studentTakingNotes },
    { slug: 'independent-learners', title: 'Creating Independent Learners: Building Self-Directed Study Skills That Last a Lifetime', excerpt: 'The goal isn\'t to homeschool forever—it\'s to create learners who don\'t need you hovering.', date: 'January 3, 2025', category: 'Student Development', readTime: '7 min read', image: girlReadingIndependently },
    { slug: 'schools-and-charters', title: 'Scaling Personalized Learning: How SmartCore Serves Private Schools, Charters, and Pods', excerpt: 'Personalized, AI-powered education for schools—differentiating instruction at scale.', date: 'January 3, 2025', category: 'Scaling Education', readTime: '9 min read', image: coffeeStudySession },
    { slug: 'ai-personalization', title: 'The Future of Homeschooling: AI-Powered Personalization at Scale', excerpt: 'What if every child had a world-class tutor available 24/7? AI makes truly personalized education possible.', date: 'January 1, 2025', category: 'Future of Education', readTime: '9 min read', image: happyLibraryStudent },
    { slug: 'rigor-and-wellbeing', title: 'Balancing Rigor and Well-Being: Academic Excellence Without the Burnout', excerpt: 'High standards don\'t mean high stress. Learn how to keep learning rigorous but sustainable.', date: 'December 30, 2024', category: 'Holistic Education', readTime: '8 min read', image: parentChildLearningTogether },
    { slug: 'portfolio-assessment', title: 'Portfolio-Based Assessment: Capturing Real Learning Beyond Traditional Tests', excerpt: 'Multiple-choice tests can\'t capture creativity or critical thinking. Portfolio systems document learning that matters.', date: 'December 28, 2024', category: 'Assessment Methods', readTime: '7 min read', image: modernReportCard },
    { slug: 'busy-families', title: 'Homeschooling Without the Burnout: For Busy Families Who Need More Hours in the Day', excerpt: 'Working from home, managing multiple kids—and teaching school? AI makes it possible.', date: 'December 28, 2024', category: 'Homeschooling', readTime: '7 min read', image: fatherTwoChildrenLaptop },
    { slug: 'project-based-learning', title: 'Teaching Critical Thinking: Project-Based Learning Made Easy with AI', excerpt: 'Project-based learning is powerful but time-intensive. AI generates custom projects aligned to standards.', date: 'December 26, 2024', category: 'Teaching Methods', readTime: '8 min read', image: studentViolinPractice },
    { slug: 'most-automated', title: 'The Most Automated Homeschool Platform in Existence', excerpt: 'Curriculum generation, grading, scheduling—all automated. The human connection? Still yours.', date: 'December 25, 2024', category: 'Technology', readTime: '6 min read', image: happyFamilyCouch },
    { slug: 'state-standards', title: 'From California to Coast-to-Coast: Bringing Standards-Aligned AI to All 50 States', excerpt: 'We started with California Common Core. Now we support every US state.', date: 'December 20, 2024', category: 'Standards', readTime: '8 min read', image: techIntegration },
    { slug: 'collaborative-learning', title: 'The Power of Collaborative Learning: Building Community in Homeschool Settings', excerpt: 'Homeschooling doesn\'t mean learning alone. Discover how to create meaningful peer connections and collaborative experiences.', date: 'December 15, 2024', category: 'Community', readTime: '7 min read', image: collaborativeLearning },
    { slug: 'parent-teacher-partnership', title: 'The Parent-Teacher Partnership: Supporting Learning at Home and School', excerpt: 'Whether hybrid, supplementing, or full-time homeschooling—effective parent involvement makes all the difference.', date: 'December 12, 2024', category: 'Parenting', readTime: '6 min read', image: parentTeacherPartnership },
    { slug: 'creative-learning', title: 'Creativity in the Curriculum: Why Arts and Play Matter in Academic Success', excerpt: 'Creative expression isn\'t a break from learning—it\'s how deeper learning happens for many students.', date: 'December 10, 2024', category: 'Holistic Education', readTime: '8 min read', image: creativeLearning },
    { slug: 'homeschool-routines', title: 'Building Sustainable Homeschool Routines: Structure That Supports, Not Restricts', excerpt: 'The best homeschool schedule is one that works with your family\'s rhythm, not against it.', date: 'December 8, 2024', category: 'Organization', readTime: '7 min read', image: familyHomeschool },
    { slug: 'public-school-supplement', title: 'Supplementing Public School: Enrichment and Intervention That Actually Works', excerpt: 'Your child attends public school but needs extra support or challenge? We fill gaps and extend learning.', date: 'December 18, 2024', category: 'Hybrid Learning', readTime: '6 min read', image: homeschoolParentLaptop },
    { slug: 'why-diagnostics-arent-tests', title: 'Why Diagnostics Aren\'t Tests (And Why That Changes Everything)', excerpt: 'Understanding the difference between discovery and judgment.', date: 'December 15, 2024', category: 'Philosophy', readTime: '5 min read', image: vintageReportCard }
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-6xl font-bold">
              Learning Forward Blog
            </h1>
            <p className="text-xl text-muted-foreground">
              Stories, insights, and science behind our approach to neurodivergent education.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {posts.map((post) => (
              <Card 
                key={post.slug}
                className="cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                onClick={() => navigate(`/blog/${post.slug}`)}
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 aspect-video md:aspect-square overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <div className="md:w-2/3 flex flex-col">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{post.category}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.date}
                        </span>
                        <span className="text-sm text-muted-foreground">• {post.readTime}</span>
                      </div>
                      <CardTitle className="text-2xl hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-primary font-medium">
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}