import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, Heart, Target, TrendingUp, Sparkles, Award, 
  Zap, BookOpen, Users, CheckCircle2, ArrowRight, Star
} from 'lucide-react';
import { MarketingNav } from '@/components/MarketingNav';
import { supabase } from '@/integrations/supabase/client';

export default function Marketing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated and redirect to dashboard
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/dashboard', { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mx-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              Built for Neurodivergent Learners
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Learning That Adapts to{' '}
              <span 
                className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-gradient-flow"
                style={{ backgroundSize: '200% 200%' }}
              >
                Your Brain
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Discover what you don't know yet—then master it. Our AI-powered platform turns every gap into a growth opportunity, 
              celebrating courage over perfection.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 animate-glow-pulse" 
                onClick={() => navigate('/auth')}
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => navigate('/about')}>
                Our Philosophy
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-8">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Free to start
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Traditional Education Wasn't Built for Every Brain
            </h2>
            <p className="text-xl text-muted-foreground">
              One-size-fits-all classrooms, high-stakes testing, and rigid timelines create anxiety—not learning.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-destructive" />
                  The Testing Trap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tests measure what you memorized yesterday, not what you're capable of learning tomorrow. 
                  One bad grade can derail confidence for months.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-destructive" />
                  The Comparison Game
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Grading on a curve means someone has to fail. Neurodivergent kids are judged against neurotypical timelines, 
                  creating shame instead of celebrating their unique way of learning.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-destructive" />
                  The Pace Problem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Move on before you're ready, or wait while bored. The classroom moves at the speed of the average, 
                  leaving brilliant minds behind or under-challenged.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
            <Badge variant="outline" className="text-lg px-4 py-1">
              <Heart className="h-4 w-4 mr-2" />
              Our Approach
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Fail Forward, Every Single Day
            </h2>
            <p className="text-xl text-muted-foreground">
              We've flipped the script on education. Here, discovery isn't scary—it's celebrated.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Assessments = Discovery, Not Judgment</h3>
                    <p className="text-muted-foreground">
                      Take a "diagnostic" on things you don't fully know yet. Get curious about your gaps. 
                      The system uses this to build your perfect curriculum—one that fills exactly the gaps you have.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Courage Badges, Not Failure Marks</h3>
                    <p className="text-muted-foreground">
                      Every diagnostic you take earns you a badge—whether you "pass" or not. We celebrate the bravery 
                      to discover what you don't know. That's where real learning begins.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Your Brain, Your Pace</h3>
                    <p className="text-muted-foreground">
                      No classroom to keep up with. No arbitrary deadlines. The AI tracks your mastery journey in real-time, 
                      adjusting daily to meet you exactly where you are.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="text-2xl">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <p><strong>Discover Your Gaps:</strong> Take diagnostic assessments to map what you don't know yet</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <p><strong>Learn & Practice:</strong> AI generates personalized lessons targeting your specific needs</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <p><strong>Master with Confidence:</strong> Prove mastery when you're ready, building your transcript</p>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <p><strong>Track Your Journey:</strong> Watch your mastery percentage climb as you fill the gaps</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Built for Neurodivergent Success
            </h2>
            <p className="text-xl text-muted-foreground">
              Every feature designed with ADHD, autism, dyslexia, and anxiety in mind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Zap,
                title: 'Focus Duck Timer',
                description: 'Gamified Pomodoro sessions with visual progress and gentle accountability'
              },
              {
                icon: Brain,
                title: 'Personalized Pacing',
                description: 'AI adjusts difficulty and timing based on your unique learning patterns'
              },
              {
                icon: Heart,
                title: 'Anxiety-Friendly Design',
                description: 'Low-pressure assessments, growth mindset messaging, and celebration of effort'
              },
              {
                icon: BookOpen,
                title: 'Multi-Modal Learning',
                description: 'Text-to-speech, bionic reading, visual aids, and choice in how you learn'
              },
              {
                icon: Target,
                title: 'Mastery Journey Tracker',
                description: 'See your progress visually. No shame in gaps—just a map to mastery'
              },
              {
                icon: Award,
                title: 'XP & Rewards System',
                description: 'Earn points for learning attempts, not just correct answers'
              }
            ].map((feature, i) => (
              <Card key={i}>
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              What Families Are Saying
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "For the first time, my ADHD daughter isn't afraid to take tests. She calls them 'discovery missions' now.",
                author: "Sarah M.",
                role: "Homeschool Parent"
              },
              {
                quote: "The courage badges changed everything. My son takes harder assessments just to see what he doesn't know yet.",
                author: "Marcus T.",
                role: "Parent of 2"
              },
              {
                quote: "Finally, a platform that gets that my kid's brain works differently—and celebrates it.",
                author: "Jennifer K.",
                role: "Special Ed Parent"
              }
            ].map((testimonial, i) => (
              <Card key={i} className="relative">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Learn Differently?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join families who've discovered that failure isn't the opposite of success—it's the path to mastery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate('/auth')}>
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => navigate('/pricing')}>
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}