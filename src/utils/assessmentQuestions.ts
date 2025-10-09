// Static assessment questions for learning style evaluation
export interface AssessmentQuestion {
  id: string;
  question: string;
  category: string;
  options: string[];
}

export const assessmentQuestions: AssessmentQuestion[] = [
  // Learning Modality (8 questions)
  {
    id: "lm1",
    question: "When studying new material, I prefer to:",
    category: "learning_style",
    options: [
      "Watch videos or look at diagrams and pictures",
      "Listen to explanations or discuss it with someone",
      "Do hands-on activities or experiments",
      "Read textbooks or write notes"
    ]
  },
  {
    id: "lm2",
    question: "I remember information best when:",
    category: "learning_style",
    options: [
      "I can see it (images, charts, videos)",
      "I hear it (lectures, discussions, audio)",
      "I practice it physically or use my hands",
      "I read and write about it"
    ]
  },
  {
    id: "lm3",
    question: "When following directions, I prefer:",
    category: "learning_style",
    options: [
      "Maps, diagrams, or visual demonstrations",
      "Verbal instructions or explanations",
      "Learning by doing it myself",
      "Written step-by-step instructions"
    ]
  },
  {
    id: "lm4",
    question: "In my free time, I enjoy:",
    category: "learning_style",
    options: [
      "Drawing, watching movies, or playing visual games",
      "Listening to music, podcasts, or conversations",
      "Sports, building things, or physical activities",
      "Reading books, writing stories, or journaling"
    ]
  },
  {
    id: "lm5",
    question: "When I'm trying to focus, I need:",
    category: "learning_style",
    options: [
      "A clean, organized visual space",
      "A quiet environment or background music",
      "To move around or fidget",
      "Good reading materials and note-taking supplies"
    ]
  },
  {
    id: "lm6",
    question: "I understand concepts better with:",
    category: "learning_style",
    options: [
      "Visual examples and color-coded notes",
      "Someone explaining it to me out loud",
      "Hands-on practice and real-world application",
      "Detailed written descriptions"
    ]
  },
  {
    id: "lm7",
    question: "When solving problems, I:",
    category: "learning_style",
    options: [
      "Visualize the solution or draw it out",
      "Talk through it or think out loud",
      "Try different approaches physically",
      "Write down my thoughts and analyze them"
    ]
  },
  {
    id: "lm8",
    question: "My ideal learning environment includes:",
    category: "learning_style",
    options: [
      "Visual aids, bright colors, and organized displays",
      "Opportunities for discussion and verbal interaction",
      "Hands-on materials and freedom to move",
      "Books, writing materials, and quiet reading time"
    ]
  },

  // Work Style & Collaboration (4 questions)
  {
    id: "ws1",
    question: "I work best:",
    category: "work_style",
    options: [
      "By myself in a quiet space",
      "With one or two close friends or partners",
      "In a group with several people",
      "With guidance from a teacher or mentor"
    ]
  },
  {
    id: "ws2",
    question: "On group projects, I prefer to:",
    category: "work_style",
    options: [
      "Work on my own part independently",
      "Partner closely with one other person",
      "Collaborate actively with the whole team",
      "Have clear direction and check-ins with an instructor"
    ]
  },
  {
    id: "ws3",
    question: "When learning something new, I like to:",
    category: "work_style",
    options: [
      "Figure it out on my own first",
      "Learn alongside a friend or peer",
      "Be part of a class or learning community",
      "Have one-on-one instruction"
    ]
  },
  {
    id: "ws4",
    question: "I feel most productive when:",
    category: "work_style",
    options: [
      "I can control my own pace and schedule",
      "I have an accountability partner",
      "I'm part of a collaborative team",
      "I have regular guidance and feedback"
    ]
  },

  // Study Habits & Organization (4 questions)
  {
    id: "sh1",
    question: "When I study, I usually:",
    category: "study_habits",
    options: [
      "Create visual study guides, mind maps, or flashcards",
      "Record myself or listen to study materials",
      "Use movement, gestures, or physical models",
      "Make detailed written notes and outlines"
    ]
  },
  {
    id: "sh2",
    question: "I organize my work by:",
    category: "study_habits",
    options: [
      "Using color coding and visual systems",
      "Setting reminders and verbal cues",
      "Keeping materials where I can access them actively",
      "Making detailed lists and written schedules"
    ]
  },
  {
    id: "sh3",
    question: "To prepare for a test, I:",
    category: "study_habits",
    options: [
      "Review visual materials and create charts",
      "Quiz myself out loud or study with someone",
      "Practice problems or create demonstrations",
      "Read my notes and write practice answers"
    ]
  },
  {
    id: "sh4",
    question: "I stay on track with assignments by:",
    category: "study_habits",
    options: [
      "Visual planners or calendars",
      "Talking through my plans with others",
      "Doing a little bit each day and staying active",
      "Maintaining detailed to-do lists"
    ]
  },

  // Motivation & Interests (4 questions)
  {
    id: "mi1",
    question: "I'm most interested in learning when:",
    category: "motivation",
    options: [
      "Topics are presented with interesting visuals",
      "I can discuss and hear different perspectives",
      "I can interact with the material hands-on",
      "I can read in-depth about the topic"
    ]
  },
  {
    id: "mi2",
    question: "I feel accomplished when:",
    category: "motivation",
    options: [
      "I see the results of my work",
      "Someone recognizes my effort verbally",
      "I complete a physical task or project",
      "I receive written feedback or grades"
    ]
  },
  {
    id: "mi3",
    question: "My favorite subjects tend to involve:",
    category: "motivation",
    options: [
      "Art, design, or visual thinking",
      "Music, languages, or communication",
      "Science, sports, or hands-on activities",
      "Literature, writing, or research"
    ]
  },
  {
    id: "mi4",
    question: "I'm motivated to learn when:",
    category: "motivation",
    options: [
      "I can see clear progress and visualize goals",
      "I receive encouragement and can discuss my ideas",
      "I can apply learning to real-world situations",
      "I understand the purpose through reading and reflection"
    ]
  }
];

export const assessmentMetadata = {
  title: "Learning Style & Personality Assessment",
  description: "Discover your unique learning style and get personalized study strategies. This assessment takes about 10-15 minutes.",
  totalQuestions: assessmentQuestions.length,
  categories: [
    { name: "Learning Modality", count: 8 },
    { name: "Work Style & Collaboration", count: 4 },
    { name: "Study Habits & Organization", count: 4 },
    { name: "Motivation & Interests", count: 4 }
  ]
};
