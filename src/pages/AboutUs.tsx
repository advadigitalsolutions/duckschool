import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingNav } from "@/components/MarketingNav";
import { useNavigate } from "react-router-dom";
import teamPhoto from "@/assets/team-photo.jpg";
import familyPhoto from "@/assets/family-photo.jpg";
import { Sparkles, Users, Code, Shield, Globe, Heart } from "lucide-react";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <MarketingNav />
      
      <main className="container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Built by Students, For Students
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            A family-owned edtech startup revolutionizing homeschool education through lived experience and cutting-edge technology.
          </p>
        </section>

        {/* Team Photo Section */}
        <section className="mb-24">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-5xl mx-auto">
            <img 
              src={teamPhoto} 
              alt="Jasmine and Isaiah, co-founders of SmartCore Education"
              className="w-full h-auto"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent p-6 md:p-8">
              <p className="text-lg md:text-xl font-semibold text-foreground">
                Jasmine (18) and Isaiah (16) — CEO and Lead Developer
              </p>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="mb-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Our Story</h2>
            
            <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
              <p className="text-lg leading-relaxed">
                SmartCore Education was born from necessity, built by a family who experienced firsthand the challenges of finding an educational approach that actually works.
              </p>
              
              <p className="text-lg leading-relaxed">
                Jasmine and Isaiah have navigated every educational landscape imaginable — private schools, public schools, and homeschooling. Both diagnosed with ADHD, Jasmine with school-based trauma, and Isaiah on the autism spectrum, they've experienced the limitations of one-size-fits-all education systems. Traditional schooling didn't just fail them; it actively worked against how their brains were wired to learn.
              </p>

              <p className="text-lg leading-relaxed">
                Their father, a software developer and former Montessori-inspired nature-based daycare owner, became a single dad juggling homeschooling and running a security-focused AI startup. When the family embraced digital nomad life, traveling the world while learning, K12 couldn't accommodate their lifestyle. The system that was supposed to support them instead became a barrier.
              </p>

              <p className="text-lg leading-relaxed">
                So they did what innovators do: they built the solution themselves.
              </p>

              <p className="text-lg leading-relaxed">
                Founded in Fall 2025, SmartCore Education started as a family project — an app designed specifically for Jasmine and Isaiah's unique learning needs. The results were transformative. The teens went from struggling with engagement to genuinely loving learning. Their father reclaimed his time while maintaining visibility into their progress against California Core State Standards, with the ability to print transcripts on demand.
              </p>

              <p className="text-lg leading-relaxed">
                What began as an internal tool quickly evolved. After their father built the initial design, Jasmine and Isaiah took over — they now handle all coding, debugging, and design decisions. At 18, Jasmine serves as CEO, leading the company alongside her brother. Their father lends his expertise in AI security, ensuring SmartCore is built on a world-class, secure foundation.
              </p>

              <div className="relative rounded-xl overflow-hidden shadow-xl my-8">
                <img 
                  src={familyPhoto} 
                  alt="The SmartCore Education family team traveling together"
                  className="w-full h-auto"
                />
              </div>

              <p className="text-lg leading-relaxed">
                Today, SmartCore Education represents more than just a product — it's proof that the most powerful educational solutions come from those who've lived the challenges they're solving.
              </p>
            </div>
          </div>
        </section>

        {/* Values Grid */}
        <section className="mb-24">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">What We Stand For</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <Heart className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-3">Lived Experience</h3>
                <p className="text-muted-foreground">
                  We don't theorize about neurodivergent learning — we live it. Every feature is battle-tested by students who understand the challenges firsthand.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Users className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-3">Family-Owned</h3>
                <p className="text-muted-foreground">
                  As a family-owned company, we're not beholden to investors pushing for profit over purpose. Our priority is building what students actually need.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Code className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-3">Student-Built</h3>
                <p className="text-muted-foreground">
                  Our platform is coded, designed, and directed by the same students using it. That's not a tagline — that's our development team.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-3">Security-First</h3>
                <p className="text-muted-foreground">
                  Leveraging expertise from enterprise AI security, we've built a platform where data protection and student privacy are non-negotiable.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Globe className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-3">Location-Independent</h3>
                <p className="text-muted-foreground">
                  Born from a digital nomad family, SmartCore works wherever life takes you — no geographic boundaries on learning.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Sparkles className="h-12 w-12 mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-3">Neurodiversity-Centered</h3>
                <p className="text-muted-foreground">
                  ADHD and autism aren't obstacles to overcome — they're different ways of thinking that deserve educational approaches built specifically for them.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Beta Status */}
        <section className="mb-24">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-2">
            <CardContent className="pt-6 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">We're Still in Beta</h2>
              <p className="text-lg mb-6 text-muted-foreground max-w-2xl mx-auto">
                SmartCore Education is actively being refined and improved. We're building in public, learning from our own experience, and preparing to offer this transformative approach to families like ours — those who've been failed by traditional systems and are ready for something different.
              </p>
              <p className="text-lg font-semibold">
                Because the best education software isn't built in boardrooms. It's built at kitchen tables by students who refuse to accept that learning has to be painful.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Waitlist</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Be among the first families to experience education that adapts to how brains actually work.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/waitlist')}
            className="text-lg px-8 py-6"
          >
            Get Early Access
          </Button>
        </section>
      </main>
    </div>
  );
};

export default AboutUs;
