export interface PsychologicalQuestion {
  id: string;
  question: string;
  category: string;
  type: 'single' | 'multiple' | 'text' | 'scale';
  options?: string[];
  placeholder?: string;
  description?: string;
}

export const psychologicalAssessmentQuestions: PsychologicalQuestion[] = [
  // Personality Dimensions (Myers-Briggs inspired)
  {
    id: "energy_source",
    question: "Where do you get your energy?",
    category: "personality_core",
    type: "multiple",
    description: "Select all that recharge you after a long day",
    options: [
      "Being around people and social activities",
      "Being alone or with one close friend",
      "A mix - depends on my mood",
      "Active environments with lots happening",
      "Quiet, calm spaces for reflection"
    ]
  },
  {
    id: "information_processing",
    question: "How do you prefer to learn new things?",
    category: "personality_core", 
    type: "multiple",
    description: "Select all that apply",
    options: [
      "Step-by-step instructions and details",
      "Big picture concepts and connections",
      "Real-world examples and applications",
      "Theories and abstract ideas",
      "Practical hands-on experience",
      "Visual patterns and relationships"
    ]
  },
  {
    id: "decision_making",
    question: "When making decisions, I tend to...",
    category: "personality_core",
    type: "multiple",
    description: "Select all that apply to how you make decisions",
    options: [
      "Analyze logically and weigh pros/cons",
      "Go with my gut feeling",
      "Consider how it affects others",
      "Look for the most efficient solution",
      "Think about values and what feels right"
    ]
  },
  {
    id: "lifestyle_preference",
    question: "I feel best when my life is...",
    category: "personality_core",
    type: "multiple",
    description: "Select all that describe when you feel your best",
    options: [
      "Organized with clear plans and schedules",
      "Flexible and spontaneous",
      "Structured but with room for creativity",
      "Open to whatever happens",
      "Balanced between planning and adapting"
    ]
  },

  // Cognitive Processing
  {
    id: "problem_solving_style",
    question: "When faced with a challenge, I...",
    category: "cognitive",
    type: "multiple",
    description: "Select all that describe you",
    options: [
      "Break it down into smaller steps",
      "Try different solutions until something works",
      "Research and gather information first",
      "Talk it through with someone",
      "Visualize the solution",
      "Jump in and learn as I go",
      "Take time to think deeply about it"
    ]
  },
  {
    id: "attention_style",
    question: "I focus best when...",
    category: "cognitive",
    type: "multiple",
    description: "Select all that apply",
    options: [
      "I can give full attention to one thing",
      "I'm working on multiple tasks",
      "There's background music or noise",
      "It's completely quiet",
      "I can take movement breaks",
      "I'm in a cozy, comfortable space",
      "I have clear deadlines"
    ]
  },
  {
    id: "memory_strength",
    question: "I remember things best by...",
    category: "cognitive",
    type: "multiple",
    description: "Select all that work for you",
    options: [
      "Seeing them (images, colors, diagrams)",
      "Hearing them (songs, rhymes, explanations)",
      "Doing them (actions, movements)",
      "Writing them down",
      "Making connections to things I know",
      "Creating stories or scenarios",
      "Repeating them several times"
    ]
  },

  // Learning Preferences
  {
    id: "ideal_learning_environment",
    question: "My ideal learning space is...",
    category: "learning",
    type: "multiple",
    description: "Select all that describe your perfect learning environment",
    options: [
      "Bright, well-lit with natural light",
      "Cozy and softly lit",
      "Complete silence",
      "Background music or white noise",
      "Comfortable seating (couch, bean bag)",
      "Traditional desk setup",
      "Alone in my own space",
      "With people nearby but quiet",
      "Temperature controlled (not too hot or cold)",
      "Access to snacks and water",
      "Minimal clutter and distractions",
      "Surrounded by inspiring decorations"
    ]
  },
  {
    id: "engagement_drivers",
    question: "I'm most excited to learn when...",
    category: "learning",
    type: "multiple",
    description: "Select all that energize you",
    options: [
      "It relates to my interests or hobbies",
      "I can see real-world applications",
      "It's challenging but achievable",
      "I can work at my own pace",
      "There are creative elements",
      "It involves problem-solving",
      "I can collaborate with others",
      "I can compete or set records",
      "It connects to bigger questions"
    ]
  },
  {
    id: "learning_obstacles",
    question: "Learning is hard for me when...",
    category: "learning",
    type: "multiple",
    description: "Select all that apply - this helps us support you better",
    options: [
      "There's too much information at once",
      "I don't see the point or purpose",
      "It's too slow or repetitive",
      "It's too fast-paced",
      "There are too many distractions",
      "I'm working alone",
      "I'm in a group",
      "The instructions are unclear",
      "It feels boring or tedious"
    ]
  },

  // Motivation & Rewards
  {
    id: "success_feeling",
    question: "I feel most accomplished when...",
    category: "motivation",
    type: "multiple",
    description: "Select all that make you feel proud",
    options: [
      "I master something difficult",
      "Someone recognizes my effort",
      "I help someone else learn",
      "I create something original",
      "I solve a complex problem",
      "I improve from where I started",
      "I reach a goal I set",
      "I discover something new"
    ]
  },
  {
    id: "stress_response",
    question: "When I'm stressed or overwhelmed, I usually...",
    category: "motivation",
    type: "multiple",
    description: "Select all that apply",
    options: [
      "Take breaks and step away",
      "Talk to someone about it",
      "Push through and keep working",
      "Get physical activity or movement",
      "Listen to music or podcasts",
      "Take deep breaths or meditate",
      "Make a plan to break it down",
      "Need time alone to recharge",
      "Cry or express emotions",
      "Distract myself with something fun",
      "Sleep or rest",
      "Avoid the stressful thing"
    ]
  },
  {
    id: "motivation_style",
    question: "What keeps you going when something is difficult?",
    category: "motivation",
    type: "multiple",
    description: "Select all that motivate you",
    options: [
      "Knowing I'll be proud of myself",
      "Not wanting to disappoint others",
      "Rewards or incentives",
      "Wanting to prove I can do it",
      "Understanding it will help my future",
      "Competition with others or myself",
      "Support and encouragement from others",
      "Seeing my progress along the way",
      "Curiosity about the outcome",
      "The challenge itself is exciting",
      "Knowing others believe in me"
    ]
  },

  // Interests & Values
  {
    id: "free_time_activities",
    question: "In my free time, I love to...",
    category: "interests",
    type: "multiple",
    description: "Select all activities you enjoy",
    options: [
      "Play video games",
      "Read books or comics",
      "Draw, paint, or create art",
      "Play sports or exercise",
      "Watch movies or shows",
      "Play musical instruments",
      "Build or make things",
      "Spend time with friends",
      "Explore outdoors and nature",
      "Code or work with technology",
      "Write stories or journals",
      "Solve puzzles or brain teasers",
      "Care for pets or animals",
      "Cook or bake",
      "Learn new things online"
    ]
  },
  {
    id: "subject_preferences",
    question: "My favorite types of learning involve...",
    category: "interests",
    type: "multiple",
    description: "Select all that interest you",
    options: [
      "Math and logic puzzles",
      "Science and experiments",
      "Reading and stories",
      "Writing and creative expression",
      "Art and design",
      "Music and sound",
      "Building and engineering",
      "History and culture",
      "Languages and communication",
      "Sports and movement",
      "Nature and animals",
      "Technology and coding"
    ]
  },
  {
    id: "learning_goals",
    question: "What do you want to get better at?",
    category: "interests",
    type: "multiple",
    description: "Select all skills you want to develop",
    options: [
      "Math and problem solving",
      "Reading and comprehension",
      "Writing and communication",
      "Science and experiments",
      "Creative arts (drawing, music, etc)",
      "Physical skills and sports",
      "Technology and coding",
      "Languages and speaking",
      "Critical thinking",
      "Time management and organization",
      "Memory and studying techniques",
      "Confidence and public speaking",
      "Social skills and teamwork",
      "Focus and concentration"
    ]
  },

  // Social Preferences
  {
    id: "work_style",
    question: "I work best...",
    category: "social",
    type: "multiple",
    description: "Select all work styles that suit you",
    options: [
      "Independently - I like working alone",
      "With one partner - paired work is ideal",
      "In small groups (3-4 people)",
      "In larger collaborative teams",
      "It depends on the task"
    ]
  },
  {
    id: "feedback_preference",
    question: "When receiving feedback on my work, I prefer...",
    category: "social",
    type: "multiple",
    description: "Select all that help you",
    options: [
      "Written detailed comments I can review",
      "Face-to-face conversation",
      "Quick verbal encouragement",
      "Specific examples of what to improve",
      "Positive feedback on what I did well",
      "Suggestions for next steps",
      "Time to process before discussing"
    ]
  },

  // Time Management & Organization
  {
    id: "organization_style",
    question: "I organize my work and time by...",
    category: "organization",
    type: "multiple",
    description: "Select all that you use",
    options: [
      "Making detailed to-do lists",
      "Using calendars and planners",
      "Setting reminders and alarms",
      "Color-coding and visual systems",
      "Keeping everything in my head",
      "Breaking big tasks into small steps",
      "Working in focused time blocks",
      "Going with the flow as things come up"
    ]
  },
  {
    id: "pacing_preference",
    question: "I prefer to learn...",
    category: "organization",
    type: "multiple",
    description: "Select all learning paces that work for you",
    options: [
      "Quickly - I like to move fast",
      "At a steady, moderate pace",
      "Slowly and thoroughly",
      "In intense bursts with breaks",
      "It varies by subject"
    ]
  }
];

export const assessmentMetadata = {
  title: "Your Personal Learning Profile",
  description: "Help us understand you as a unique learner so we can personalize your educational experience. This isn't a test - there are no right or wrong answers! We want to know what makes you YOU.",
  totalQuestions: psychologicalAssessmentQuestions.length,
  estimatedTime: "15-20 minutes",
  categories: [
    { name: "Personality Core", count: 4 },
    { name: "Cognitive Processing", count: 3 },
    { name: "Learning Preferences", count: 3 },
    { name: "Motivation & Rewards", count: 3 },
    { name: "Interests & Values", count: 3 },
    { name: "Social Preferences", count: 2 },
    { name: "Organization", count: 2 }
  ]
};
