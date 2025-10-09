import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPersonalityTypeConfig } from '@/utils/personalityTypeConfig';
import { 
  Eye, Hand, Ear, BookOpen, Sparkles, Target, TrendingUp, 
  Lightbulb, Brain, Star, Award, CheckCircle2, Home
} from 'lucide-react';
import { BionicText } from './BionicText';

interface PersonalityReportViewProps {
  student: any;
}

const iconMap: Record<string, any> = {
  Eye, Hand, Ear, BookOpen, Sparkles
};

export function PersonalityReportView({ student }: PersonalityReportViewProps) {
  const hasSelfAssessment = student?.profile_assessment_completed;
  const hasAdminAssessment = student?.administrator_assessment && Object.keys(student.administrator_assessment).length > 0;

  if (!hasSelfAssessment && !hasAdminAssessment) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium mb-2">No learning profile available yet</p>
          <p className="text-sm">Complete the curriculum planning chat or the learning assessment to create your profile.</p>
        </CardContent>
      </Card>
    );
  }

  const config = getPersonalityTypeConfig(student?.personality_type || 'Multimodal Learner');
  const IconComponent = iconMap[config.icon] || Sparkles;
  const learningProfile = student?.learning_profile || {};
  const categories = learningProfile.categories || {};
  const adminAssessment = student?.administrator_assessment || {};

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-6 pr-4">
        {/* Administrator Assessment Section */}
        {hasAdminAssessment && (
          <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Learning Profile from Curriculum Planning
              </CardTitle>
              <p className="text-white/80 text-sm">
                Created from your conversation with our curriculum planning assistant
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminAssessment.pedagogicalApproach && (
                <div>
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Recommended Teaching Approach
                  </p>
                  <p className="text-white/90">{adminAssessment.pedagogicalApproach}</p>
                </div>
              )}
              {adminAssessment.goals && (
                <div>
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Educational Goals
                  </p>
                  <p className="text-white/90">{adminAssessment.goals}</p>
                </div>
              )}
              {adminAssessment.interests && adminAssessment.interests.length > 0 && (
                <div>
                  <p className="font-semibold mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Interests & Passions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {adminAssessment.interests.map((interest: string, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-white/20 text-white">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {adminAssessment.strengths && adminAssessment.strengths.length > 0 && (
                <div>
                  <p className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Strengths
                  </p>
                  <ul className="space-y-1">
                    {adminAssessment.strengths.map((strength: string, index: number) => (
                      <li key={index} className="text-white/90 text-sm flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {adminAssessment.challenges && adminAssessment.challenges.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Areas to Support</p>
                  <ul className="space-y-1">
                    {adminAssessment.challenges.map((challenge: string, index: number) => (
                      <li key={index} className="text-white/90 text-sm flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-white/70 mt-2 flex-shrink-0" />
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {adminAssessment.motivators && adminAssessment.motivators.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">What Motivates Them</p>
                  <ul className="space-y-1">
                    {adminAssessment.motivators.map((motivator: string, index: number) => (
                      <li key={index} className="text-white/90 text-sm flex items-start gap-2">
                        <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {motivator}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {adminAssessment.accommodations && adminAssessment.accommodations.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Recommended Accommodations</p>
                  <ul className="space-y-1">
                    {adminAssessment.accommodations.map((accommodation: string, index: number) => (
                      <li key={index} className="text-white/90 text-sm flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {accommodation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Self-Assessment Hero Section */}
        {hasSelfAssessment && (
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
                Self-Assessment Results
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
        )}

        {/* Personality Type Overview - only show if self-assessment exists */}
        {hasSelfAssessment && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Learning Personality
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground"><BionicText>{config.description}</BionicText></p>
                
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Key Characteristics
                  </h4>
                  <ul className="space-y-2">
                    {config.characteristics.map((char, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Star className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                        <span className="text-sm"><BionicText>{char}</BionicText></span>
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
                      <span className="text-sm flex-1"><BionicText>{strategy}</BionicText></span>
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
                <p className="text-muted-foreground"><BionicText>{config.idealEnvironment}</BionicText></p>
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
                      <span className="text-sm font-medium"><BionicText>{strength}</BionicText></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ScrollArea>
  );
}
