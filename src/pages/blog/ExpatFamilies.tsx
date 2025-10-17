import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingNav } from '@/components/MarketingNav';

export default function ExpatFamilies() {
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
                <Badge variant="secondary">Lifestyle</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  January 8, 2025
                </span>
                <span className="text-sm text-muted-foreground">• 7 min read</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                World-Schooling Made Easy: How Duckschool Supports Expat and Traveling Families
              </h1>
            </div>

            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl text-muted-foreground">
                From Tokyo to Tanzania, maintain US educational standards and college readiness while embracing the world as your classroom.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Expat Education Challenge</h2>
              <p>
                You're living in Singapore, but your kids need to be college-ready for US universities. Or you're digital nomads bouncing between time zones, cultures, and countries every few months. Or you're military families relocating every 2-3 years.
              </p>

              <p>
                Traditional solutions fall short:
              </p>
              <ul className="space-y-2">
                <li><strong>International schools</strong> are prohibitively expensive ($20-40K/year per child)</li>
                <li><strong>Local schools</strong> don't prepare students for US college admissions</li>
                <li><strong>US online schools</strong> require live class attendance during US hours (3am in Tokyo?)</li>
                <li><strong>Boxed curriculum</strong> must be shipped internationally and weighs 40 pounds per grade</li>
              </ul>

              <p>
                You want your kids to experience the world <em>and</em> stay academically competitive. Why should you have to choose?
              </p>

              <h2 className="text-2xl font-bold mt-8">How Duckschool Supports Global Families</h2>

              <h3 className="text-xl font-bold mt-6">1. Cloud-Based, Zero Equipment</h3>
              <p>
                Everything lives in the cloud. No textbooks to ship. No materials to haul between countries. Just a laptop and internet connection. Your entire school fits in a backpack.
              </p>

              <h3 className="text-xl font-bold mt-6">2. Timezone Agnostic</h3>
              <p>
                No live classes. No synchronous requirements. The AI generates lessons on-demand. Whether you're schooling at 6am in Bangkok or 3pm in Barcelona, the platform is available 24/7.
              </p>

              <p>
                Parents can set "school hours" for their local timezone, and the platform adapts. Visiting grandparents in California for two weeks? Shift your schedule temporarily. The AI doesn't care.
              </p>

              <h3 className="text-xl font-bold mt-6">3. US Standards Aligned (All 50 States)</h3>
              <p>
                We started with California Common Core standards but now support all 50 US states. Choose your home state, and the platform ensures your child masters those specific standards—even while living in Dubai.
              </p>

              <p>
                When it's time for college applications, your transcript shows clear alignment with US educational expectations. Admissions officers understand exactly what your student accomplished.
              </p>

              <h3 className="text-xl font-bold mt-6">4. Cultural Integration, Not Isolation</h3>
              <p>
                Here's where world-schooling gets magical: our AI can incorporate your host country into the curriculum.
              </p>

              <ul className="space-y-2">
                <li>Learning about ancient civilizations? The AI generates assignments based on the temples you visited in Cambodia.</li>
                <li>Studying geometry? Calculate the angles in Barcelona's Sagrada Familia.</li>
                <li>Reading world literature? Study Japanese poetry while living in Kyoto.</li>
                <li>Learning about ecosystems? Document the rainforest biodiversity you're experiencing in Costa Rica.</li>
              </ul>

              <p>
                The world becomes your textbook. Standards get met <em>through</em> travel, not despite it.
              </p>

              <h3 className="text-xl font-bold mt-6">5. Parent Dashboard for Distributed Teams</h3>
              <p>
                One parent in London for work while the other travels with kids in Southeast Asia? Both parents access the same dashboard. Track progress, leave encouraging comments, stay involved—no matter where you are.
              </p>

              <h2 className="text-2xl font-bold mt-8">Offline Mode for Adventure Days</h2>
              <p>
                Trekking through the Himalayas with spotty internet? Download upcoming assignments ahead of time. Students complete work offline, and everything syncs when you reconnect. Remote locations don't mean missed school days.
              </p>

              <h2 className="text-2xl font-bold mt-8">College Admissions from Abroad</h2>
              <p>
                US colleges love world-schooling students—when they can understand the academic rigor. Our platform generates:
              </p>
              <ul className="space-y-2">
                <li>Official transcripts showing state-aligned coursework</li>
                <li>Detailed learning records for each standard mastered</li>
                <li>Portfolio documentation of real-world learning experiences</li>
                <li>AP and SAT prep integrated seamlessly</li>
              </ul>

              <p>
                Your student can explain their unique education journey while demonstrating they met rigorous US standards. Best of both worlds.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Repatriation Transition</h2>
              <p>
                Heading back to the US after years abroad? No awkward transition period. Your child has been following the same standards as their US peers. They can slip into a US school mid-year or continue homeschooling—they're academically on track either way.
              </p>

              <h2 className="text-2xl font-bold mt-8">Military Families: Finally, Continuity</h2>
              <p>
                PCS every 2-3 years? Each new base means new schools, new curricula, new gaps. With Duckschool:
              </p>
              <ul className="space-y-2">
                <li>Curriculum stays consistent across moves</li>
                <li>Nothing falls through cracks during transitions</li>
                <li>Students maintain friendships and routine even as location changes</li>
                <li>Works whether you're stationed in Germany, Japan, or Kansas</li>
              </ul>

              <h2 className="text-2xl font-bold mt-8">What Expat and Traveling Families Tell Us</h2>
              <p>
                "We've lived in 5 countries in 7 years. Duckschool is the first solution that actually traveled with us without losing continuity."
              </p>

              <p>
                "My kids are learning about World War II while living in Berlin. The AI generates assignments based on museums we visit. It's surreal and amazing."
              </p>

              <p>
                "We were terrified our daughter would fall behind during our sabbatical year in South America. She actually advanced two grade levels because she was finally engaged."
              </p>

              <p>
                "As military parents, we've done seven school transitions. Never again. Duckschool stays consistent no matter where the Air Force sends us."
              </p>

              <h2 className="text-2xl font-bold mt-8">The Language Advantage</h2>
              <p>
                Many expat kids are multilingual. Our platform supports this:
              </p>
              <ul className="space-y-2">
                <li>Assignments can incorporate foreign language practice</li>
                <li>AI recognizes multilingual responses</li>
                <li>Cultural studies tie into your host country's history</li>
                <li>World geography becomes personal, not abstract</li>
              </ul>

              <p>
                Your kids aren't missing out on education by traveling. They're getting a richer education <em>because</em> they're traveling.
              </p>

              <h2 className="text-2xl font-bold mt-8">The Bottom Line</h2>
              <p>
                You don't have to choose between giving your children a global upbringing and preparing them for US colleges. You don't have to sacrifice their education for your career mobility or nomadic lifestyle.
              </p>

              <p>
                Duckschool travels with you—lightweight, flexible, rigorous, and fully aligned with US standards. Whether you're expats, digital nomads, military families, or extended travelers, your kids can thrive academically while embracing the world.
              </p>

              <p className="text-xl font-semibold">
                The world is your classroom. Let's make it count.
              </p>

              <div className="border-t pt-8 mt-12">
                <p className="text-muted-foreground italic">
                  Ready to take education global?
                </p>
                <Button 
                  size="lg" 
                  className="mt-4"
                  onClick={() => navigate('/auth')}
                >
                  Start Your Journey
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
