import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { BionicText } from './BionicText';
import { MathText } from './MathText';
import { cleanMarkdown } from '@/utils/textFormatting';

interface Question {
  id: string;
  type: 'multiple_choice' | 'short_answer' | 'numeric';
  question: string;
  points: number;
  options?: string[];
  correct_answer: string | number;
  tolerance?: number;
  explanation: string;
}

interface TeacherQuestionViewProps {
  questions: Question[];
}

export function TeacherQuestionView({ questions }: TeacherQuestionViewProps) {
  if (!questions || questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No questions available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-primary mb-2">Teacher's Answer Key</h3>
        <p className="text-sm text-muted-foreground">
          This view shows all questions with correct answers highlighted. Use this as a reference when helping students.
        </p>
      </div>

      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-base flex items-start gap-3">
                <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 text-sm">
                  {index + 1}
                </span>
                <MathText><BionicText>{cleanMarkdown(question.question)}</BionicText></MathText>
              </CardTitle>
              <Badge variant="outline">{question.points} pts</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.type === 'multiple_choice' && question.options && (
              <div className="space-y-2">
                {question.options.map((option, optIndex) => {
                  const isCorrect = option === question.correct_answer;
                  return (
                    <div
                      key={optIndex}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                        isCorrect
                          ? 'bg-success/10 border-success'
                          : 'bg-muted/50 border-muted'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isCorrect ? 'bg-success border-success' : 'border-muted-foreground'
                      }`}>
                        {isCorrect && <CheckCircle2 className="h-4 w-4 text-success-foreground" />}
                      </div>
                      <span className={isCorrect ? 'font-medium' : ''}>
                        <MathText><BionicText>{option}</BionicText></MathText>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {question.type === 'short_answer' && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm font-medium text-success mb-1">Correct Answer:</p>
                <p className="text-foreground"><BionicText>{String(question.correct_answer)}</BionicText></p>
              </div>
            )}

            {question.type === 'numeric' && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <p className="text-sm font-medium text-success mb-1">Correct Answer:</p>
                <p className="text-foreground font-mono text-lg">{question.correct_answer}</p>
                {question.tolerance && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Tolerance: ±{question.tolerance}
                  </p>
                )}
              </div>
            )}

            {question.explanation && (
              <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                <p className="text-sm font-medium mb-2">Explanation:</p>
                <p className="text-sm text-muted-foreground">
                  <BionicText>{cleanMarkdown(question.explanation)}</BionicText>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
