import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, Meh, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiagnosticWarmupPhaseProps {
  assessmentId: string;
  subject: string;
  onComplete: (responses: Record<string, string>) => void;
}

// Common topics by subject
const SUBJECT_TOPICS: Record<string, string[]> = {
  "Mathematics": [
    "Number Operations",
    "Fractions & Decimals",
    "Ratios & Proportions",
    "Algebraic Expressions",
    "Equations & Inequalities",
    "Geometry Basics",
    "Measurement & Data",
    "Statistics & Probability"
  ],
  "English Language Arts": [
    "Reading Comprehension",
    "Vocabulary",
    "Grammar & Mechanics",
    "Writing Structure",
    "Literary Analysis",
    "Research Skills",
    "Speaking & Listening"
  ],
  "Science": [
    "Scientific Method",
    "Matter & Energy",
    "Forces & Motion",
    "Life Cycles",
    "Ecosystems",
    "Earth Systems",
    "Chemical Reactions"
  ],
  "Social Studies": [
    "Geography",
    "Historical Events",
    "Government",
    "Economics",
    "Civic Responsibility",
    "Cultural Studies"
  ],
  "Home Economics": [
    "Cooking & Nutrition",
    "Food Safety & Storage",
    "Meal Planning & Budgeting",
    "Household Management",
    "Sewing & Clothing Care",
    "Home Maintenance",
    "Time Management",
    "Consumer Skills"
  ],
  "Life Skills": [
    "Personal Finance",
    "Communication Skills",
    "Problem Solving",
    "Daily Organization",
    "Health & Wellness",
    "Career Planning",
    "Social Skills",
    "Decision Making"
  ],
  "Physical Education": [
    "Fitness & Conditioning",
    "Team Sports",
    "Individual Sports",
    "Health & Nutrition",
    "Movement Skills",
    "Sports Rules & Strategy",
    "Injury Prevention",
    "Lifetime Fitness"
  ],
  "Arts & Music": [
    "Visual Arts Techniques",
    "Music Theory",
    "Performance Skills",
    "Art History",
    "Creative Expression",
    "Composition",
    "Art Appreciation",
    "Media & Technology"
  ],
  "Foreign Language": [
    "Vocabulary & Phrases",
    "Grammar Basics",
    "Reading Comprehension",
    "Listening Skills",
    "Speaking & Pronunciation",
    "Writing Skills",
    "Cultural Context",
    "Conversation Skills"
  ],
  "Computer Science": [
    "Programming Basics",
    "Computational Thinking",
    "Data Structures",
    "Algorithms",
    "Web Development",
    "Software Design",
    "Debugging & Testing",
    "Computer Systems"
  ],
  "Other": [
    "Foundational Concepts",
    "Core Skills",
    "Application & Practice",
    "Analysis & Evaluation",
    "Creative Thinking",
    "Problem Solving",
    "Communication",
    "Advanced Topics"
  ]
};

// Topic examples to help students understand concepts
const TOPIC_EXAMPLES: Record<string, string> = {
  // Mathematics
  "Number Operations": "Adding, subtracting, multiplying, and dividing (e.g., 24 × 3 = 72)",
  "Fractions & Decimals": "Working with parts of numbers (e.g., 1/2 = 0.5, or 3/4 + 1/4)",
  "Ratios & Proportions": "Comparing quantities (e.g., 2:3 ratio, or if 2 apples cost $1, how much for 6?)",
  "Algebraic Expressions": "Using variables in math (e.g., 3x + 5, or solving 2y - 4 = 10)",
  "Equations & Inequalities": "Finding unknown values (e.g., x + 7 = 15, or 2x < 10)",
  "Geometry Basics": "Shapes, angles, and measurements (e.g., area of a rectangle, or angles in a triangle)",
  "Measurement & Data": "Units, converting, and interpreting data (e.g., inches to feet, or reading charts)",
  "Statistics & Probability": "Averages and likelihood (e.g., mean of 5, 7, 9 or chance of rolling a 6)",
  
  // English Language Arts
  "Reading Comprehension": "Understanding what you read (e.g., identifying main ideas, making inferences)",
  "Vocabulary": "Word meanings and usage (e.g., synonyms, context clues, word roots)",
  "Grammar & Mechanics": "Proper sentence structure (e.g., subject-verb agreement, punctuation)",
  "Writing Structure": "Organizing your writing (e.g., paragraphs, introductions, conclusions)",
  "Literary Analysis": "Understanding stories (e.g., theme, character development, symbolism)",
  "Research Skills": "Finding and using information (e.g., citing sources, evaluating credibility)",
  "Speaking & Listening": "Communication skills (e.g., presentations, active listening)",
  
  // Science
  "Scientific Method": "How scientists investigate (e.g., hypothesis, experiment, conclusion)",
  "Matter & Energy": "States of matter and energy forms (e.g., solid/liquid/gas, heat transfer)",
  "Forces & Motion": "How things move (e.g., gravity, friction, speed and acceleration)",
  "Life Cycles": "How living things grow (e.g., butterfly metamorphosis, plant growth)",
  "Ecosystems": "How organisms interact (e.g., food chains, habitats, adaptations)",
  "Earth Systems": "Earth's processes (e.g., weather, rock cycle, water cycle)",
  "Chemical Reactions": "How substances change (e.g., mixing baking soda and vinegar)",
  
  // Social Studies
  "Geography": "Places and maps (e.g., continents, coordinates, physical features)",
  "Historical Events": "Important past events (e.g., wars, discoveries, social movements)",
  "Government": "How societies are governed (e.g., democracy, laws, branches of government)",
  "Economics": "Money and resources (e.g., supply and demand, trade, budgeting)",
  "Civic Responsibility": "Citizen duties (e.g., voting, community service, rights)",
  "Cultural Studies": "Different cultures (e.g., traditions, beliefs, customs)",
  
  // Home Economics
  "Cooking & Nutrition": "Preparing meals and eating healthy (e.g., recipe following, food groups, balanced diet)",
  "Food Safety & Storage": "Keeping food safe (e.g., proper temperatures, expiration dates, cross-contamination)",
  "Meal Planning & Budgeting": "Planning affordable meals (e.g., grocery lists, comparing prices, portion sizes)",
  "Household Management": "Keeping a home organized (e.g., cleaning schedules, organizing spaces, maintenance)",
  "Sewing & Clothing Care": "Clothing skills (e.g., basic sewing, laundry, stain removal, ironing)",
  "Home Maintenance": "Basic home repairs (e.g., changing light bulbs, unclogging drains, tool use)",
  "Time Management": "Managing your time (e.g., schedules, prioritizing tasks, balancing responsibilities)",
  "Consumer Skills": "Smart shopping (e.g., comparing prices, reading labels, making informed purchases)",
  
  // Life Skills
  "Personal Finance": "Managing money (e.g., budgeting, saving, understanding bills, credit basics)",
  "Communication Skills": "Talking with others (e.g., active listening, clear speaking, conflict resolution)",
  "Problem Solving": "Finding solutions (e.g., identifying problems, evaluating options, making decisions)",
  "Daily Organization": "Managing your time and tasks (e.g., schedules, prioritizing, balancing responsibilities)",
  "Health & Wellness": "Taking care of yourself (e.g., exercise, sleep, mental health, hygiene)",
  "Career Planning": "Preparing for work (e.g., job searching, resumes, interviews, career goals)",
  "Social Skills": "Interacting with others (e.g., making friends, teamwork, respect, empathy)",
  "Decision Making": "Making good choices (e.g., weighing pros and cons, considering consequences)",
  
  // Physical Education
  "Fitness & Conditioning": "Getting and staying fit (e.g., cardio, strength training, flexibility)",
  "Team Sports": "Playing with others (e.g., basketball, soccer, volleyball, cooperation)",
  "Individual Sports": "Personal athletics (e.g., running, swimming, tennis, golf)",
  "Sports Rules & Strategy": "Understanding games (e.g., rules, tactics, sportsmanship)",
  "Movement Skills": "Basic body movements (e.g., throwing, catching, balance, coordination)",
  "Injury Prevention": "Staying safe (e.g., warming up, proper form, protective equipment)",
  "Lifetime Fitness": "Long-term health (e.g., creating exercise habits, nutrition, wellness)",
  
  // Arts & Music
  "Visual Arts Techniques": "Creating art (e.g., drawing, painting, sculpture, design principles)",
  "Music Theory": "Understanding music (e.g., notes, rhythm, scales, reading sheet music)",
  "Performance Skills": "Performing for others (e.g., stage presence, rehearsal, expression)",
  "Art History": "Famous artists and styles (e.g., movements, periods, cultural contexts)",
  "Creative Expression": "Sharing ideas through art (e.g., personal style, interpretation, innovation)",
  "Composition": "Creating original work (e.g., songwriting, arranging, visual composition)",
  "Art Appreciation": "Understanding art (e.g., critiquing, analyzing, interpreting meaning)",
  "Media & Technology": "Digital arts (e.g., photography, digital music, graphic design)",
  
  // Foreign Language
  "Vocabulary & Phrases": "Learning words and expressions (e.g., greetings, common phrases, everyday words)",
  "Grammar Basics": "Language structure (e.g., verb conjugation, sentence structure, tenses)",
  "Listening Skills": "Understanding spoken language (e.g., listening for meaning, accents)",
  "Speaking & Pronunciation": "Talking in the language (e.g., correct sounds, accent, fluency)",
  "Writing Skills": "Writing in the language (e.g., sentences, paragraphs, correct spelling)",
  "Cultural Context": "Understanding the culture (e.g., customs, traditions, cultural references)",
  "Conversation Skills": "Having discussions (e.g., asking questions, responding, natural flow)",
  
  // Computer Science
  "Programming Basics": "Writing code (e.g., variables, loops, functions, basic syntax)",
  "Computational Thinking": "Breaking down problems (e.g., logical thinking, patterns, step-by-step solutions)",
  "Data Structures": "Organizing information (e.g., arrays, lists, objects, data organization)",
  "Algorithms": "Problem-solving steps (e.g., sorting, searching, efficiency)",
  "Web Development": "Creating websites (e.g., HTML, CSS, JavaScript, web design)",
  "Software Design": "Planning programs (e.g., planning logic, user interface, requirements)",
  "Debugging & Testing": "Finding and fixing errors (e.g., troubleshooting, testing code)",
  "Computer Systems": "How computers work (e.g., hardware, operating systems, networks)",
  
  // Other
  "Foundational Concepts": "Basic ideas and principles (e.g., core concepts, fundamental theories)",
  "Core Skills": "Essential abilities (e.g., basic techniques, primary skills)",
  "Application & Practice": "Using what you know (e.g., real-world examples, hands-on practice)",
  "Analysis & Evaluation": "Examining and judging (e.g., critical thinking, assessment)",
  "Creative Thinking": "Coming up with new ideas (e.g., brainstorming, innovation)",
  "Communication": "Sharing information (e.g., explaining, presenting, discussing)",
  "Advanced Topics": "More complex ideas (e.g., specialized concepts, deeper understanding)"
};

export function DiagnosticWarmupPhase({ assessmentId, subject, onComplete }: DiagnosticWarmupPhaseProps) {
  const topics = SUBJECT_TOPICS[subject] || SUBJECT_TOPICS["Mathematics"];
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentTopic = topics[currentIndex];
  const progress = (Object.keys(responses).length / topics.length) * 100;

  const handleResponse = (level: 'confident' | 'unsure' | 'not_confident') => {
    const newResponses = { ...responses, [currentTopic]: level };
    setResponses(newResponses);

    if (currentIndex < topics.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All topics covered
      onComplete(newResponses);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Let's Start Easy</h2>
        <p className="text-muted-foreground">
          How comfortable do you feel with these topics? Be honest - there's no wrong answer!
        </p>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-xl">{currentTopic}</CardTitle>
          <CardDescription className="mt-2 space-y-1">
            <div className="text-sm text-muted-foreground italic">
              {TOPIC_EXAMPLES[currentTopic] || ""}
            </div>
            <div className="text-sm font-medium mt-2">
              How confident are you with this topic?
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => handleResponse('confident')}
              variant="outline"
              size="lg"
              className={cn(
                "h-auto py-6 flex-col gap-2 border-2 transition-all",
                "hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950"
              )}
            >
              <ThumbsUp className="h-8 w-8 text-green-600" />
              <span className="font-medium">Confident</span>
              <span className="text-xs text-muted-foreground">I know this well</span>
            </Button>

            <Button
              onClick={() => handleResponse('unsure')}
              variant="outline"
              size="lg"
              className={cn(
                "h-auto py-6 flex-col gap-2 border-2 transition-all",
                "hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950"
              )}
            >
              <Meh className="h-8 w-8 text-yellow-600" />
              <span className="font-medium">Unsure</span>
              <span className="text-xs text-muted-foreground">I know some of it</span>
            </Button>

            <Button
              onClick={() => handleResponse('not_confident')}
              variant="outline"
              size="lg"
              className={cn(
                "h-auto py-6 flex-col gap-2 border-2 transition-all",
                "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
              )}
            >
              <ThumbsDown className="h-8 w-8 text-blue-600" />
              <span className="font-medium">New to Me</span>
              <span className="text-xs text-muted-foreground">I haven't learned this yet</span>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            {currentIndex + 1} of {topics.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}