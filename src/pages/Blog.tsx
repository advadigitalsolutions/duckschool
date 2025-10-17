import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';

export default function Blog() {
  const navigate = useNavigate();

  const posts = [
    {
      slug: 'why-diagnostics-arent-tests',
      title: "Why Diagnostics Aren't Tests (And Why That Changes Everything)",
      excerpt: 'Understanding the difference between discovery and judgment—and how it transforms learning for neurodivergent kids.',
      date: 'December 15, 2024',
      category: 'Philosophy',
      readTime: '5 min read'
    },
    {
      slug: 'adhd-student-thriving',
      title: 'How One ADHD Student Went from Avoiding Tests to Seeking Them Out',
      excerpt: "A parent's story of transformation when assessments became discovery tools instead of judgment.",
      date: 'December 10, 2024',
      category: 'Success Stories',
      readTime: '8 min read'
    },
    {
      slug: 'courage-badges-psychology',
      title: 'The Psychology Behind Courage Badges: Why Rewarding Attempts Matters',
      excerpt: 'What neuroscience tells us about growth mindset, intrinsic motivation, and celebrating the learning process.',
      date: 'December 5, 2024',
      category: 'Research',
      readTime: '7 min read'
    }
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