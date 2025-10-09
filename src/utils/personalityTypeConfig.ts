export interface PersonalityTypeConfig {
  name: string;
  color: string;
  gradient: string;
  icon: string;
  description: string;
  characteristics: string[];
  studyStrategies: string[];
  idealEnvironment: string;
  strengths: string[];
  famousArchetypes: string[];
}

export const personalityTypeConfigs: Record<string, PersonalityTypeConfig> = {
  'Visual Learner': {
    name: 'Visual Learner',
    color: 'hsl(var(--chart-1))',
    gradient: 'from-purple-500 to-pink-500',
    icon: 'Eye',
    description: 'You learn best through seeing and visualizing information. Images, diagrams, and visual demonstrations help you understand and remember concepts.',
    characteristics: [
      'Remember faces better than names',
      'Prefer visual instructions and demonstrations',
      'Notice details in your environment',
      'Think in pictures and visualize outcomes',
      'Enjoy colorful notes and diagrams'
    ],
    studyStrategies: [
      'Create mind maps and flowcharts',
      'Use color-coding in your notes',
      'Watch educational videos and tutorials',
      'Draw diagrams to explain concepts',
      'Use flashcards with images'
    ],
    idealEnvironment: 'A well-lit, organized space with visual aids, charts, and colorful materials. Minimal visual distractions work best.',
    strengths: ['Pattern recognition', 'Spatial awareness', 'Creative visualization', 'Design thinking'],
    famousArchetypes: ['Artists', 'Architects', 'Designers', 'Engineers']
  },
  'Kinesthetic Learner': {
    name: 'Kinesthetic Learner',
    color: 'hsl(var(--chart-2))',
    gradient: 'from-orange-500 to-red-500',
    icon: 'Hand',
    description: 'You learn best through hands-on experiences and physical activity. Movement and touch help you understand and retain information.',
    characteristics: [
      'Learn by doing and experimenting',
      'Need to move around while learning',
      'Enjoy building and creating things',
      'Remember what you physically did',
      'Prefer active demonstrations'
    ],
    studyStrategies: [
      'Build models and conduct experiments',
      'Take frequent movement breaks',
      'Use manipulatives and tools',
      'Act out concepts or role-play',
      'Study while walking or standing'
    ],
    idealEnvironment: 'A flexible space where you can move around, with tools and materials for hands-on activities. Room for physical movement is key.',
    strengths: ['Problem-solving', 'Practical skills', 'Coordination', 'Physical awareness'],
    famousArchetypes: ['Athletes', 'Surgeons', 'Craftspeople', 'Performers']
  },
  'Auditory Learner': {
    name: 'Auditory Learner',
    color: 'hsl(var(--chart-3))',
    gradient: 'from-blue-500 to-cyan-500',
    icon: 'Ear',
    description: 'You learn best through listening and speaking. Hearing information and discussing concepts helps you understand and remember.',
    characteristics: [
      'Remember what you hear',
      'Enjoy discussions and debates',
      'Prefer verbal instructions',
      'Think out loud when solving problems',
      'Learn through listening to lectures'
    ],
    studyStrategies: [
      'Record and listen to your notes',
      'Discuss topics with study partners',
      'Explain concepts out loud',
      'Listen to educational podcasts',
      'Use mnemonics and rhymes'
    ],
    idealEnvironment: 'A quiet space where you can read aloud or discuss without disturbing others. Background music may help some auditory learners.',
    strengths: ['Communication', 'Language skills', 'Listening comprehension', 'Verbal expression'],
    famousArchetypes: ['Musicians', 'Teachers', 'Counselors', 'Public Speakers']
  },
  'Reading/Writing Learner': {
    name: 'Reading/Writing Learner',
    color: 'hsl(var(--chart-4))',
    gradient: 'from-green-500 to-emerald-500',
    icon: 'BookOpen',
    description: 'You learn best through reading and writing. Written words help you process, understand, and remember information most effectively.',
    characteristics: [
      'Love reading books and articles',
      'Prefer written instructions',
      'Take detailed notes',
      'Enjoy writing to express ideas',
      'Remember written information easily'
    ],
    studyStrategies: [
      'Rewrite notes in your own words',
      'Create detailed outlines and lists',
      'Read extensively on topics',
      'Write summaries after learning',
      'Use flashcards with text'
    ],
    idealEnvironment: 'A quiet, comfortable space with good lighting for reading and writing. Access to books and writing materials is essential.',
    strengths: ['Written communication', 'Research skills', 'Analysis', 'Documentation'],
    famousArchetypes: ['Writers', 'Researchers', 'Journalists', 'Academics']
  },
  'Multimodal Learner': {
    name: 'Multimodal Learner',
    color: 'hsl(var(--chart-5))',
    gradient: 'from-indigo-500 to-purple-500',
    icon: 'Sparkles',
    description: 'You learn effectively through multiple modalities. You adapt your learning style based on the situation and combine different approaches.',
    characteristics: [
      'Flexible learning approach',
      'Adapt to different teaching styles',
      'Use multiple study methods',
      'Balance various learning preferences',
      'Combine visual, auditory, and kinesthetic elements'
    ],
    studyStrategies: [
      'Mix different study techniques',
      'Use videos with note-taking',
      'Combine reading with discussions',
      'Create multi-sensory learning experiences',
      'Vary your study methods to stay engaged'
    ],
    idealEnvironment: 'A versatile space with access to various learning tools - visual aids, audio resources, hands-on materials, and quiet reading areas.',
    strengths: ['Adaptability', 'Versatility', 'Comprehensive understanding', 'Flexibility'],
    famousArchetypes: ['Innovators', 'Educators', 'Entrepreneurs', 'Renaissance Thinkers']
  }
};

export function getPersonalityTypeConfig(personalityType: string): PersonalityTypeConfig {
  return personalityTypeConfigs[personalityType] || personalityTypeConfigs['Multimodal Learner'];
}
