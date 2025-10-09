import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPersonalityTypeConfig } from '@/utils/personalityTypeConfig';
import { 
  Eye, Hand, Ear, BookOpen, Sparkles, Target, TrendingUp, 
  Lightbulb, Users, Brain, Clock, Star, Award, CheckCircle2,
  Home, Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PersonalityReportProps {
  student: any;
  onRetake: () => void;
}

const iconMap: Record<string, any> = {
  Eye, Hand, Ear, BookOpen, Sparkles
};

export function PersonalityReport({ student, onRetake }: PersonalityReportProps) {
  const navigate = useNavigate();
  const config = getPersonalityTypeConfig(student?.personality_type || 'Multimodal Learner');
  const IconComponent = iconMap[config.icon] || Sparkles;
  const learningProfile = student?.learning_profile || {};
  const categories = learningProfile.categories || {};

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-6 pb-8">
        {/* Hero Section */}
        <Card className={`bg-gradient-to-br ${config.gradient} text-white border-0 shadow-xl animate-fade-in`}>
          <CardHeader className="text-center pb-8 pt-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse bg-white/30 rounded-full blur-xl" />
                <div className="relative bg-white/20 backdrop-blur-sm p-6 rounded-full">
                  <IconComponent className="h-16 w-16" />
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold mb-2">
              Congratulations, {student?.display_name || student?.name}! 🎉
            </CardTitle>
            <CardDescription className="text-white/90 text-lg">
              You've completed your learning profile assessment
            </CardDescription>
            <div className="mt-4">
              <Badge variant="secondary" className="text-lg px-6 py-2 bg-white text-primary">
                {config.name}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Personality Type Overview */}
        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Your Learning Personality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{config.description}</p>
            
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Key Characteristics
              </h4>
              <ul className="space-y-2">
                {config.characteristics.map((char, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">{char}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Famous Archetypes</p>
              <div className="flex flex-wrap gap-2">
                {config.famousArchetypes.map((archetype, index) => (
                  <Badge key={index} variant="outline">{archetype}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Study Strategies */}
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              How You Learn Best
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {config.studyStrategies.map((strategy, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm flex-1">{strategy}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Ideal Environment */}
        <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Your Ideal Learning Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{config.idealEnvironment}</p>
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {config.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                  <Award className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">{strength}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Learning Style Breakdown */}
        {categories.learning_style && (
          <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Your Learning Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(categories).map(([category, responses]: [string, any], index) => {
                if (!Array.isArray(responses) || responses.length === 0) return null;
                
                const categoryTitle = category
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');

                return (
                  <div key={category} className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {categoryTitle}
                    </h4>
                    <div className="space-y-1">
                      {responses.map((response: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {response}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Lifelong Learning Section */}
        <Card className="border-primary/20 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Becoming a Lifelong Learner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 bg-primary/5 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  Use This Knowledge to Deepen Your Learning
                </h4>
                <p className="text-sm text-muted-foreground">
                  Understanding your learning style is the first step to becoming a more effective learner. 
                  Now that you know how you learn best, you can actively choose study methods and environments 
                  that work with your natural strengths rather than against them.
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-2">Apply Your Style Daily</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Before starting any assignment, ask yourself: "How can I use my learning style to understand this better?"</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Experiment with the strategies listed above and notice which ones help you learn faster and retain more</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Don't be afraid to combine multiple approaches - most successful learners use several modalities</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-2">Growth Mindset for Lifelong Learning</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Remember: Your learning style is a strength, not a limitation. Great learners:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Stay curious:</strong> Ask questions and seek to understand "why" and "how"</span>
                  </li>
                  <li className="flex gap-2">
                    <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Reflect regularly:</strong> Think about what you learned and how you can apply it</span>
                  </li>
                  <li className="flex gap-2">
                    <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Embrace challenges:</strong> Difficult tasks are opportunities to grow stronger</span>
                  </li>
                  <li className="flex gap-2">
                    <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Connect learning:</strong> Link new knowledge to what you already know</span>
                  </li>
                  <li className="flex gap-2">
                    <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Teach others:</strong> Explaining concepts to someone else deepens your own understanding</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium">
                  💡 <strong>Pro Tip:</strong> Share this report with your teachers and family. When they understand 
                  how you learn best, they can better support your educational journey and help you reach your full potential.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="border-primary/20 animate-fade-in" style={{ animationDelay: '700ms' }}>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <h3 className="font-semibold">Ready to Apply Your Learning Style?</h3>
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your assignments will now be personalized based on your unique learning profile. 
                This means better engagement and more effective learning!
              </p>
              <div className="flex flex-wrap gap-3 justify-center pt-2 print:hidden">
                <Button onClick={() => navigate('/student')} className="gap-2">
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => window.print()} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print Report
                </Button>
                <Button variant="ghost" onClick={onRetake}>
                  Retake Assessment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
