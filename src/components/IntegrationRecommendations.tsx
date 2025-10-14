import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingDown, Target } from "lucide-react";

interface WeakArea {
  subject: string;
  standard_code: string;
  mastery_level: number;
  priority_score: number;
}

interface IntegrationRecommendation {
  weak_area: WeakArea;
  quality_score: number;
  naturalness_rating: 'high' | 'medium' | 'low';
  integration_suggestions: string[];
}

interface IntegrationRecommendationsProps {
  recommendations: IntegrationRecommendation[];
  targetCourses: Array<{ subject: string; title: string }>;
}

export function IntegrationRecommendations({ 
  recommendations, 
  targetCourses 
}: IntegrationRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            No Weak Areas Detected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Great! No significant weak areas found. The AI will focus on advancing learning in new areas.
          </p>
        </CardContent>
      </Card>
    );
  }

  const highQuality = recommendations.filter(r => r.naturalness_rating === 'high');
  const mediumQuality = recommendations.filter(r => r.naturalness_rating === 'medium');

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Cross-Subject Integration Opportunities
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Found {highQuality.length} high-quality and {mediumQuality.length} medium-quality integration opportunities
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top 3 Recommendations */}
        {recommendations.slice(0, 3).map((rec, idx) => (
          <div key={idx} className="space-y-2 pb-3 border-b last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  <span className="text-xs font-medium">
                    {rec.weak_area.subject}: {rec.weak_area.standard_code}
                  </span>
                </div>
                <Progress value={rec.weak_area.mastery_level} className="h-1.5 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Current Mastery: {rec.weak_area.mastery_level}% | Priority: {rec.weak_area.priority_score}/100
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge 
                  variant={rec.naturalness_rating === 'high' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {rec.naturalness_rating} quality
                </Badge>
                <span className="text-xs text-muted-foreground">{rec.quality_score}% match</span>
              </div>
            </div>
            
            <div className="ml-5 space-y-1">
              <p className="text-xs font-medium text-primary">Integration Ideas:</p>
              {rec.integration_suggestions.slice(0, 2).map((suggestion, sIdx) => (
                <p key={sIdx} className="text-xs text-muted-foreground pl-2">
                  • {suggestion}
                </p>
              ))}
            </div>
          </div>
        ))}

        {recommendations.length > 3 && (
          <p className="text-xs text-muted-foreground italic text-center pt-2">
            + {recommendations.length - 3} more opportunities will be considered
          </p>
        )}

        <div className="pt-3 border-t">
          <p className="text-xs text-primary/80 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>
              The AI will naturally weave these weak areas into your {targetCourses.length}-course assignment
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
