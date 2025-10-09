import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPersonalityTypeConfig } from '@/utils/personalityTypeConfig';
import { 
  Eye, Hand, Ear, BookOpen, Sparkles, Target, TrendingUp, 
  Lightbulb, Users, Brain, Clock, Star, Award, CheckCircle2,
  Home, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PersonalityReportProps {
  student: any;
  onRetake: () => void;
}

const iconMap: Record<string, any> = {
  Eye, Hand, Ear, BookOpen, Sparkles
};

export function PersonalityReport({ student, onRetake }: PersonalityReportProps) {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const config = getPersonalityTypeConfig(student?.personality_type || 'Multimodal Learner');
  const IconComponent = iconMap[config.icon] || Sparkles;
  const learningProfile = student?.learning_profile || {};
  const categories = learningProfile.categories || {};
  
  // Generate personalized tips based on actual responses
  const generatePersonalizedTips = () => {
    const tips: string[] = [];
    const responses = learningProfile.responses || {};
    const personalityType = student?.personality_type || '';
    
    // Analyze their specific preferences from responses
    Object.values(responses).forEach((response: any) => {
      const resp = String(response).toLowerCase();
      
      // Visual preferences
      if (resp.includes('video') || resp.includes('diagram') || resp.includes('visual')) {
        tips.push('When studying new material, start by creating a visual representation - draw a diagram, make a flowchart, or use color-coded notes to map out the key concepts before reading in detail.');
      }
      if (resp.includes('quiet') && !tips.some(t => t.includes('noise-canceling'))) {
        tips.push('Since you prefer quiet environments, invest in noise-canceling headphones or find a dedicated quiet study space. Even 15 minutes of focused, silent study is more effective than an hour with distractions.');
      }
      
      // Kinesthetic preferences
      if (resp.includes('hands-on') || resp.includes('practice') || resp.includes('building')) {
        tips.push('Before diving into reading, try to physically interact with the material - build a model, create flashcards you can sort and arrange, or use manipulatives to represent concepts you\'re learning.');
      }
      if (resp.includes('walk') || resp.includes('move')) {
        tips.push('Turn your study sessions into movement sessions: walk while reviewing flashcards, pace while reciting key points, or do light stretches between practice problems. Your brain processes better when your body is in motion.');
      }
      
      // Auditory preferences  
      if (resp.includes('discuss') || resp.includes('talk') || resp.includes('explain')) {
        tips.push('After each study session, explain what you learned out loud - either to someone else, to a stuffed animal, or even to yourself in the mirror. The act of verbalizing helps cement the information in your memory.');
      }
      if (resp.includes('listen') || resp.includes('audio')) {
        tips.push('Record yourself reading your notes aloud and listen back during downtime (commute, before bed, during exercise). Hearing the information in your own voice is particularly effective for your learning style.');
      }
      
      // Reading/Writing preferences
      if (resp.includes('read') || resp.includes('write') || resp.includes('notes')) {
        tips.push('After every lesson or reading, write a one-paragraph summary in your own words. This active processing transforms passive reading into active learning and reveals gaps in your understanding.');
      }
      if (resp.includes('list') || resp.includes('organize')) {
        tips.push('Start each study session by creating a structured outline of what you need to learn. Break complex topics into numbered lists and sub-points - your brain processes information better when it\'s organized hierarchically.');
      }
      
      // Group vs solo preferences
      if (resp.includes('group') || resp.includes('collaborative')) {
        tips.push('Schedule at least one study group session per week, even if just 30 minutes. Teaching concepts to peers or hearing their explanations will deepen your understanding far more than solo study alone.');
      }
      if (resp.includes('solo') || resp.includes('independent')) {
        tips.push('Protect your independent study time by setting clear boundaries. Turn off notifications, use a "do not disturb" sign, and commit to focused 25-minute blocks followed by 5-minute breaks (Pomodoro technique).');
      }
      
      // Time preferences
      if (resp.includes('morning')) {
        tips.push('Since you work best in the morning, tackle your most challenging subjects first thing when your mental energy is highest. Save easier tasks like organizing notes or reviewing for later in the day.');
      }
      if (resp.includes('evening') || resp.includes('night')) {
        tips.push('Your peak focus hours are in the evening, so structure your day accordingly. Do lighter activities earlier and save deep learning work for when your brain is naturally most alert.');
      }
    });
    
    // Add personality-type specific tips
    if (personalityType.includes('Visual')) {
      tips.push('Create a visual "memory palace" for complex topics - assign physical locations in a familiar space to different concepts, then mentally walk through that space to recall the information during tests.');
    } else if (personalityType.includes('Kinesthetic')) {
      tips.push('Use physical gestures or actions to represent key concepts. When you need to recall information, reproduce those movements - your muscle memory will trigger the mental recall.');
    } else if (personalityType.includes('Auditory')) {
      tips.push('Create mnemonics, rhymes, or songs for information you need to memorize. Your auditory memory is strong, so setting facts to a familiar tune can make them stick permanently.');
    } else if (personalityType.includes('Reading/Writing')) {
      tips.push('Maintain a learning journal where you reflect on what you learned each day. Writing "Today I learned..." and explaining it forces deeper processing than just highlighting text.');
    }
    
    // Ensure we have at least 5 unique tips
    const uniqueTips = [...new Set(tips)];
    return uniqueTips.slice(0, 6);
  };
  
  const personalizedTips = generatePersonalizedTips();

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    
    pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`${student?.display_name || student?.name}-learning-profile.pdf`);
  };

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div ref={reportRef} className="space-y-6 pb-8">
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

        {/* Personalized Action Plan */}
        <Card className="border-primary/20 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Your Personalized Action Plan
            </CardTitle>
            <CardDescription>
              Based on your specific responses, here are concrete ways to apply your learning style starting today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {personalizedTips.map((tip, index) => (
                <div key={index} className="flex gap-3 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border-l-2 border-primary">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lifelong Learning Section */}
        <Card className="border-primary/20 animate-fade-in" style={{ animationDelay: '700ms' }}>
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
                  Understanding Your Unique Learning DNA
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your assessment revealed specific patterns in how you process information. This isn't just about 
                  being "visual" or "hands-on" - it's about understanding the precise combination of factors that 
                  make learning click for YOU. Use the personalized tips above as your starting playbook.
                </p>
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
        <Card className="border-primary/20 animate-fade-in" style={{ animationDelay: '800ms' }}>
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
                <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Report
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
