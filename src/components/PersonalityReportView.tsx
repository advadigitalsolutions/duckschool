import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPersonalityTypeConfig } from '@/utils/personalityTypeConfig';
import { 
  Eye, Hand, Ear, BookOpen, Sparkles, Target, TrendingUp, 
  Lightbulb, Brain, Star, Award, CheckCircle2, Home
} from 'lucide-react';

interface PersonalityReportViewProps {
  student: any;
}

const iconMap: Record<string, any> = {
  Eye, Hand, Ear, BookOpen, Sparkles
};

export function PersonalityReportView({ student }: PersonalityReportViewProps) {
  if (!student?.profile_assessment_completed) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>This student hasn't completed their learning profile assessment yet.</p>
        </CardContent>
      </Card>
    );
  }

  const config = getPersonalityTypeConfig(student?.personality_type || 'Multimodal Learner');
  const IconComponent = iconMap[config.icon] || Sparkles;
  const learningProfile = student?.learning_profile || {};
  const categories = learningProfile.categories || {};

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-6 pr-4">
        {/* Hero Section */}
        <Card className={`bg-gradient-to-br ${config.gradient} text-white border-0`}>
          <CardHeader className="text-center pb-6 pt-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="relative bg-white/20 backdrop-blur-sm p-4 rounded-full">
                  <IconComponent className="h-12 w-12" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mb-2">
              {student?.display_name || student?.name}'s Learning Profile
            </CardTitle>
            <div className="mt-3">
              <Badge variant="secondary" className="text-base px-4 py-1 bg-white text-primary">
                {config.name}
              </Badge>
            </div>
            {learningProfile.assessmentDate && (
              <p className="text-white/80 text-sm mt-2">
                Completed: {new Date(learningProfile.assessmentDate).toLocaleDateString()}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Personality Type Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Learning Personality
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
          </CardContent>
        </Card>

        {/* Study Strategies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Recommended Study Strategies
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Ideal Learning Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{config.idealEnvironment}</p>
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Strengths
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
      </div>
    </ScrollArea>
  );
}
