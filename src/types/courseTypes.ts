export interface CourseType {
  key: string;
  displayName: string;
  subject: string;
  gradeRange: string;
  allowPrefixes: string[];
  description?: string;
}

export const COURSE_TYPES: CourseType[] = [
  // Mathematics
  {
    key: 'pre_algebra',
    displayName: 'Pre-Algebra',
    subject: 'Mathematics',
    gradeRange: '6-8',
    allowPrefixes: ['6.NS', '6.EE', '6.G', '7.NS', '7.EE', '7.G', '8.NS', '8.EE', '8.G', '8.F'],
    description: 'Foundation for algebraic thinking'
  },
  {
    key: 'algebra_1',
    displayName: 'Algebra I',
    subject: 'Mathematics',
    gradeRange: '8-10',
    allowPrefixes: ['A.SSE', 'A.APR', 'A.CED', 'A.REI', 'F.IF', 'F.BF', 'F.LE', 'S.ID'],
    description: 'First year of high school algebra'
  },
  {
    key: 'geometry',
    displayName: 'Geometry',
    subject: 'Mathematics',
    gradeRange: '9-11',
    allowPrefixes: ['G.CO', 'G.SRT', 'G.C', 'G.GPE', 'G.GMD', 'G.MG'],
    description: 'Plane and solid geometry'
  },
  {
    key: 'algebra_2',
    displayName: 'Algebra II',
    subject: 'Mathematics',
    gradeRange: '10-12',
    allowPrefixes: ['A.SSE', 'A.APR', 'A.CED', 'A.REI', 'F.IF', 'F.BF', 'F.TF', 'N.CN', 'N.VM'],
    description: 'Advanced algebra topics'
  },
  {
    key: 'precalculus',
    displayName: 'Pre-Calculus',
    subject: 'Mathematics',
    gradeRange: '11-12',
    allowPrefixes: ['F.TF', 'N.CN', 'N.VM', 'A.APR'],
    description: 'Preparation for calculus'
  },
  {
    key: 'calculus',
    displayName: 'Calculus',
    subject: 'Mathematics',
    gradeRange: '11-12',
    allowPrefixes: ['calculus', 'derivative', 'integral', 'limit'],
    description: 'Differential and integral calculus'
  },
  {
    key: 'statistics',
    displayName: 'Statistics',
    subject: 'Mathematics',
    gradeRange: '11-12',
    allowPrefixes: ['S.ID', 'S.IC', 'S.CP', 'S.MD'],
    description: 'Probability and statistics'
  },
  {
    key: 'general_math',
    displayName: 'General Mathematics',
    subject: 'Mathematics',
    gradeRange: 'K-12',
    allowPrefixes: [],
    description: 'General math curriculum'
  },

  // English/Language Arts
  {
    key: 'ela_literature',
    displayName: 'Literature',
    subject: 'English/Language Arts',
    gradeRange: '9-12',
    allowPrefixes: ['RL.', 'RI.'],
    description: 'Literary analysis and reading'
  },
  {
    key: 'ela_composition',
    displayName: 'Composition & Writing',
    subject: 'English/Language Arts',
    gradeRange: '9-12',
    allowPrefixes: ['W.', 'WHST.'],
    description: 'Writing and composition'
  },
  {
    key: 'ela_language',
    displayName: 'Language & Grammar',
    subject: 'English/Language Arts',
    gradeRange: '9-12',
    allowPrefixes: ['L.'],
    description: 'Grammar, vocabulary, and conventions'
  },
  {
    key: 'general_ela',
    displayName: 'General English/Language Arts',
    subject: 'English/Language Arts',
    gradeRange: 'K-12',
    allowPrefixes: [],
    description: 'General ELA curriculum'
  },

  // Science
  {
    key: 'biology',
    displayName: 'Biology',
    subject: 'Science',
    gradeRange: '9-12',
    allowPrefixes: ['HS-LS'],
    description: 'Life sciences'
  },
  {
    key: 'chemistry',
    displayName: 'Chemistry',
    subject: 'Science',
    gradeRange: '10-12',
    allowPrefixes: ['HS-PS1'],
    description: 'Chemical sciences'
  },
  {
    key: 'physics',
    displayName: 'Physics',
    subject: 'Science',
    gradeRange: '11-12',
    allowPrefixes: ['HS-PS2', 'HS-PS3', 'HS-PS4'],
    description: 'Physical sciences'
  },
  {
    key: 'earth_science',
    displayName: 'Earth Science',
    subject: 'Science',
    gradeRange: '9-11',
    allowPrefixes: ['HS-ESS'],
    description: 'Earth and space sciences'
  },
  {
    key: 'general_science',
    displayName: 'General Science',
    subject: 'Science',
    gradeRange: 'K-12',
    allowPrefixes: [],
    description: 'General science curriculum'
  },

  // History/Social Studies
  {
    key: 'us_history',
    displayName: 'U.S. History',
    subject: 'History/Social Studies',
    gradeRange: '9-12',
    allowPrefixes: ['HSS-'],
    description: 'United States history'
  },
  {
    key: 'world_history',
    displayName: 'World History',
    subject: 'History/Social Studies',
    gradeRange: '9-12',
    allowPrefixes: ['HSS-'],
    description: 'World history and cultures'
  },
  {
    key: 'government',
    displayName: 'Government/Civics',
    subject: 'History/Social Studies',
    gradeRange: '11-12',
    allowPrefixes: ['HSS-'],
    description: 'Government and civics'
  },
  {
    key: 'economics',
    displayName: 'Economics',
    subject: 'History/Social Studies',
    gradeRange: '11-12',
    allowPrefixes: ['HSS-'],
    description: 'Economics and financial literacy'
  },
  {
    key: 'general_social_studies',
    displayName: 'General Social Studies',
    subject: 'History/Social Studies',
    gradeRange: 'K-12',
    allowPrefixes: [],
    description: 'General social studies curriculum'
  },

  // Other subjects default to general
  {
    key: 'general_pe',
    displayName: 'Physical Education',
    subject: 'Physical Education',
    gradeRange: 'K-12',
    allowPrefixes: [],
    description: 'Physical education and health'
  },
  {
    key: 'general_spanish',
    displayName: 'Spanish',
    subject: 'Spanish',
    gradeRange: 'K-12',
    allowPrefixes: [],
    description: 'Spanish language learning'
  },
  {
    key: 'general_cs',
    displayName: 'Computer Science',
    subject: 'Computer Science',
    gradeRange: 'K-12',
    allowPrefixes: [],
    description: 'Computer science and programming'
  },
  {
    key: 'general_art',
    displayName: 'Art',
    subject: 'Art',
    gradeRange: 'K-12',
    allowPrefixes: [],
    description: 'Visual arts'
  },
  {
    key: 'general_music',
    displayName: 'Music',
    subject: 'Music',
    gradeRange: 'K-12',
    allowPrefixes: [],
    description: 'Music education'
  },
  {
    key: 'general_other',
    displayName: 'Other',
    subject: 'Other',
    gradeRange: 'K-12',
    allowPrefixes: [],
    description: 'Other curriculum'
  },
];

export function getCourseTypesBySubject(subject: string): CourseType[] {
  return COURSE_TYPES.filter(ct => ct.subject === subject);
}

export function getCourseTypeByKey(key: string): CourseType | undefined {
  return COURSE_TYPES.find(ct => ct.key === key);
}
