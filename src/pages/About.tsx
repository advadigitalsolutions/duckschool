import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, Heart, Sparkles, Target, TrendingUp, 
  Award, Lightbulb, Users, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      
      {/* Hero */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="mx-auto">
              <Heart className="h-3 w-3 mr-1" />
              Our Philosophy
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Education That Celebrates{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                What You Don't Know Yet
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              We believe that discovering gaps isn't failure—it's the first step toward mastery.
            </p>
          </div>
        </div>
      </section>

      {/* The Problem With Traditional Testing */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">The Problem With Traditional Testing</h2>
              <p className="text-xl text-muted-foreground">
                Tests were designed to sort students, not support them.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-destructive" />
                    <h3 className="text-xl font-bold">Traditional Assessment</h3>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Measures what you memorized yesterday</li>
                    <li>• One chance to prove yourself</li>
                    <li>• Failure means shame and falling behind</li>
                    <li>• Grades define your worth</li>
                    <li>• High stakes create anxiety</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-bold">Our Diagnostic Approach</h3>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Reveals what you're ready to learn next</li>
                    <li>• Unlimited attempts to grow</li>
                    <li>• Discovery earns courage badges</li>
                    <li>• Progress defines your journey</li>
                    <li>• Low pressure enables honesty</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
            <h2 className="text-4xl font-bold">Our Core Principles</h2>
            <p className="text-xl text-muted-foreground">
              These beliefs guide everything we build.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {[
              {
                icon: Brain,
                title: '1. Every Brain Learns Differently',
                description: 'Neurodivergent isn\'t broken—it\'s brilliant. ADHD, autism, dyslexia, anxiety—these aren\'t obstacles to overcome. They\'re unique cognitive patterns that deserve respect and support. Our platform adapts to your brain, not the other way around.'
              },
              {
                icon: Heart,
                title: '2. Courage > Perfection',
                description: 'The bravest thing you can do is admit what you don\'t know. We reward the vulnerability it takes to say "I need help with this." Every diagnostic assessment you take—whether you score 20% or 80%—is an act of courage that earns recognition.'
              },
              {
                icon: Lightbulb,
                title: '3. Gaps Are Maps, Not Failures',
                description: 'When you discover what you don\'t understand, you\'ve just created the perfect curriculum for yourself. Our AI doesn\'t judge your gaps—it fills them with precision learning experiences tailored exactly to what you need.'
              },
              {
                icon: TrendingUp,
                title: '4. Progress Beats Speed',
                description: 'You\'re not racing anyone else. Master concepts at your pace. Take longer on hard topics. Breeze through what clicks quickly. The only metric that matters is: are you growing toward mastery?'
              },
              {
                icon: Award,
                title: '5. Two Types of Assessment',
                description: 'Diagnostics discover gaps (celebrated, not graded). Mastery demonstrations prove competence (graded for transcripts). We separate learning from proving—so you can be honest about what you don\'t know without academic consequences.'
              },
              {
                icon: Users,
                title: '6. Community of Growth',
                description: 'You\'re not competing against other students. When you discover a gap, you\'re helping yourself. When another learner does, they\'re helping themselves. We all fail forward together.'
              }
            ].map((principle, i) => (
              <Card key={i} className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <principle.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">{principle.title}</h3>
                      <p className="text-muted-foreground">{principle.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How We Balance Transcripts */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold">But Wait—What About Transcripts?</h2>
              <p className="text-xl text-muted-foreground">
                We haven't forgotten that colleges still expect grades.
              </p>
            </div>

            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="pt-6 space-y-6">
                <p className="text-lg">
                  Here's how we balance the real world's demand for grades with our philosophy:
                </p>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Diagnostic Assessments = Discovery</p>
                      <p className="text-muted-foreground">
                        Take as many as you want. They don't appear on transcripts. They're pure learning tools that help the AI understand you.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Practice = Learning</p>
                      <p className="text-muted-foreground">
                        Work through personalized lessons and exercises. Get feedback, iterate, improve. None of this is graded for your transcript.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Mastery Demonstrations = Grades</p>
                      <p className="text-muted-foreground">
                        When you're confident, take a "mastery" assessment. This one counts for your transcript. You decide when you're ready—no arbitrary deadlines.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      4
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Your Transcript Reflects True Mastery</p>
                      <p className="text-muted-foreground">
                        Only your final mastery demonstrations appear as grades. Colleges see competence, not your learning journey.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <p className="text-muted-foreground italic">
                    <strong>The result:</strong> You get the safety to explore and fail forward, while still building a competitive transcript. 
                    The world gets evidence of your competence. You get a learning environment free of shame.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Fail Forward?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join us in redefining what education can be.
            </p>
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate('/auth')}>
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}