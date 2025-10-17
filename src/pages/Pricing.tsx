import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';

export default function Pricing() {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Explorer',
      price: 'Free',
      description: 'Perfect for trying out the platform',
      features: [
        '1 student',
        '2 courses at a time',
        'Diagnostic assessments',
        'Basic mastery tracking',
        'Community support',
        'Core accessibility features'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Learner',
      price: '$29',
      period: '/month',
      description: 'For serious homeschool families',
      features: [
        'Up to 3 students',
        'Unlimited courses',
        'Full diagnostic suite',
        'Advanced mastery analytics',
        'AI-generated curriculum',
        'Priority support',
        'All accessibility features',
        'XP & rewards system',
        'Focus Duck timer',
        'Official transcripts'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Academy',
      price: '$79',
      period: '/month',
      description: 'For co-ops and micro-schools',
      features: [
        'Up to 10 students',
        'Everything in Learner',
        'Multi-educator access',
        'Advanced analytics',
        'Custom frameworks',
        'White-label options',
        'Dedicated support',
        'Training sessions',
        'API access (coming soon)'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
            <Badge variant="secondary" className="mx-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              Simple, Transparent Pricing
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold">
              Choose Your Learning Journey
            </h1>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade anytime. All plans include our core "fail forward" philosophy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, i) => (
              <Card 
                key={i} 
                className={`relative ${plan.popular ? 'border-2 border-primary shadow-xl scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => navigate('/auth')}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Can I change plans later?</h3>
                  <p className="text-muted-foreground">
                    Absolutely! Upgrade or downgrade anytime. Your data stays intact and you only pay for what you use.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">What's included in the free trial?</h3>
                  <p className="text-muted-foreground">
                    14-day access to the Learner plan with all features unlocked. No credit card required to start.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
                  <p className="text-muted-foreground">
                    Yes! If you're not satisfied within the first 30 days, we'll refund 100% of your payment.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Are transcripts legally recognized?</h3>
                  <p className="text-muted-foreground">
                    Our transcripts meet California homeschool requirements and can be customized for college applications. 
                    They show traditional grades for "mastery" assessments while keeping diagnostic discoveries separate.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}