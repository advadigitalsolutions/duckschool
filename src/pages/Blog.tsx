import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';

export default function Blog() {
  const navigate = useNavigate();

  const posts = [
    { slug: 'pedagogies-supported', title: 'One Platform, Every Pedagogy: How Duckschool Adapts to Your Teaching Philosophy', excerpt: 'From Montessori to Classical, Charlotte Mason to unschooling—discover how our AI-powered platform supports any approach.', date: 'January 15, 2025', category: 'Philosophy', readTime: '10 min read' },
    { slug: 'adhd-support', title: 'Built for ADHD Brains: How Duckschool Turns Executive Function Challenges into Strengths', excerpt: 'ADHD brains are brilliantly wired for depth, creativity, and hyperfocus—when the environment supports them.', date: 'January 12, 2025', category: 'Neurodivergence', readTime: '8 min read' },
    { slug: 'dyslexia-support', title: 'Reading Shouldn\'t Be a Barrier to Learning: How Duckschool Supports Dyslexic Students', excerpt: 'Dyslexic students are often brilliant thinkers trapped behind a reading barrier. When we remove it, they shine.', date: 'January 10, 2025', category: 'Accessibility', readTime: '9 min read' },
    { slug: 'expat-families', title: 'World-Schooling Made Easy: How Duckschool Supports Expat and Traveling Families', excerpt: 'From Tokyo to Tanzania, maintain US educational standards while embracing the world as your classroom.', date: 'January 8, 2025', category: 'Lifestyle', readTime: '7 min read' },
    { slug: 'just-in-time-curriculum', title: 'Just-In-Time Curriculum: Teaching What Your Child Needs, Exactly When They Need It', excerpt: 'AI-powered learning delivers personalized instruction based on daily diagnostic data.', date: 'January 5, 2025', category: 'Innovation', readTime: '8 min read' },
    { slug: 'schools-and-charters', title: 'Scaling Personalized Learning: How Duckschool Serves Private Schools, Charters, and Pods', excerpt: 'Personalized, AI-powered education for schools—differentiating instruction at scale.', date: 'January 3, 2025', category: 'Scaling Education', readTime: '9 min read' },
    { slug: 'busy-families', title: 'Homeschooling Without the Burnout: For Busy Families Who Need More Hours in the Day', excerpt: 'Working from home, managing multiple kids—and teaching school? AI makes it possible.', date: 'December 28, 2024', category: 'Homeschooling', readTime: '7 min read' },
    { slug: 'most-automated', title: 'The Most Automated Homeschool Platform in Existence', excerpt: 'Curriculum generation, grading, scheduling—all automated. The human connection? Still yours.', date: 'December 25, 2024', category: 'Technology', readTime: '6 min read' },
    { slug: 'state-standards', title: 'From California to Coast-to-Coast: Bringing Standards-Aligned AI to All 50 States', excerpt: 'We started with California Common Core. Now we support every US state.', date: 'December 20, 2024', category: 'Standards', readTime: '8 min read' },
    { slug: 'public-school-supplement', title: 'Supplementing Public School: Enrichment and Intervention That Actually Works', excerpt: 'Your child attends public school but needs extra support or challenge? We fill gaps and extend learning.', date: 'December 18, 2024', category: 'Hybrid Learning', readTime: '6 min read' },
    { slug: 'why-diagnostics-arent-tests', title: 'Why Diagnostics Aren\'t Tests (And Why That Changes Everything)', excerpt: 'Understanding the difference between discovery and judgment.', date: 'December 15, 2024', category: 'Philosophy', readTime: '5 min read' }
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
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/blog/${post.slug}`)}
              >
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
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}