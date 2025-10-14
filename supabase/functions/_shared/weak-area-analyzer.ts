/**
 * Weak Area Analysis Service
 * Analyzes student performance data to identify knowledge gaps and weak areas
 */

export interface WeakArea {
  subject: string;
  standard_code: string;
  description: string;
  mastery_level: number;
  confidence: number;
  priority_score: number;
  recent_attempts: number;
  last_attempt_date?: string;
}

export interface CrossSubjectIntegration {
  weak_area: WeakArea;
  target_courses: string[];
  integration_suggestions: string[];
  quality_score: number;
  naturalness_rating: 'high' | 'medium' | 'low';
}

export async function analyzeWeakAreas(
  supabase: any,
  studentId: string,
  targetCourseIds: string[]
): Promise<WeakArea[]> {
  const weakAreas: WeakArea[] = [];

  // 1. Get mastery data
  const { data: masteryData } = await supabase
    .from('standard_mastery')
    .select('*, courses!inner(subject, title)')
    .eq('student_id', studentId)
    .lt('mastery_level', 70)
    .order('mastery_level', { ascending: true });

  // 2. Get progress gaps
  const { data: gaps } = await supabase
    .from('progress_gaps')
    .select('*, courses!inner(subject, title)')
    .eq('student_id', studentId)
    .is('addressed_at', null)
    .order('confidence_score', { ascending: true });

  // 3. Get recent poor performance
  const { data: recentGrades } = await supabase
    .from('grades')
    .select(`
      *,
      assignments!inner(
        curriculum_items!inner(
          course_id,
          standards,
          courses!inner(subject)
        )
      )
    `)
    .eq('student_id', studentId)
    .lt('score', 70)
    .gte('graded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('graded_at', { ascending: false });

  // Process mastery data
  if (masteryData) {
    for (const mastery of masteryData) {
      weakAreas.push({
        subject: mastery.courses?.subject || 'Unknown',
        standard_code: mastery.standard_code,
        description: `Low mastery: ${mastery.mastery_level}%`,
        mastery_level: mastery.mastery_level,
        confidence: mastery.confidence_score || 50,
        priority_score: calculatePriorityScore(mastery.mastery_level, mastery.total_attempts, mastery.confidence_score),
        recent_attempts: mastery.total_attempts || 0,
        last_attempt_date: mastery.last_assessed_at
      });
    }
  }

  // Process gaps
  if (gaps) {
    for (const gap of gaps) {
      const existing = weakAreas.find(w => w.standard_code === gap.standard_code);
      if (existing) {
        existing.priority_score += 20; // Boost priority if also in gaps
      } else {
        weakAreas.push({
          subject: gap.courses?.subject || 'Unknown',
          standard_code: gap.standard_code,
          description: gap.gap_type,
          mastery_level: 0,
          confidence: gap.confidence_score || 30,
          priority_score: 80, // Gaps are high priority
          recent_attempts: 0
        });
      }
    }
  }

  // Process recent failures
  if (recentGrades) {
    for (const grade of recentGrades) {
      const assignments = Array.isArray(grade.assignments) ? grade.assignments : [grade.assignments];
      for (const assignment of assignments) {
        if (!assignment?.curriculum_items) continue;
        const standards = assignment.curriculum_items.standards || [];
        const subject = assignment.curriculum_items.courses?.subject;

        for (const std of standards) {
          const code = typeof std === 'string' ? std : std.code;
          const existing = weakAreas.find(w => w.standard_code === code);
          if (existing) {
            existing.priority_score += 10;
            existing.recent_attempts++;
          }
        }
      }
    }
  }

  // Sort by priority and return top areas
  return weakAreas
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 10);
}

export function calculatePriorityScore(
  masteryLevel: number,
  attempts: number,
  confidence: number
): number {
  // Lower mastery = higher priority
  const masteryComponent = (100 - masteryLevel) * 0.5;
  
  // More attempts without improvement = higher priority
  const attemptComponent = Math.min(attempts * 5, 30);
  
  // Lower confidence = higher priority
  const confidenceComponent = (100 - confidence) * 0.2;
  
  return Math.round(masteryComponent + attemptComponent + confidenceComponent);
}

export function planCrossSubjectIntegration(
  weakAreas: WeakArea[],
  targetCourses: Array<{ id: string; subject: string; title: string }>,
  assignmentTopic: string
): CrossSubjectIntegration[] {
  const integrations: CrossSubjectIntegration[] = [];

  for (const weakArea of weakAreas) {
    // Find courses where this weak area could be naturally integrated
    const relevantCourses = targetCourses.filter(course => 
      course.subject !== weakArea.subject // Cross-subject integration
    );

    if (relevantCourses.length === 0) continue;

    const integration: CrossSubjectIntegration = {
      weak_area: weakArea,
      target_courses: relevantCourses.map(c => c.id),
      integration_suggestions: generateIntegrationSuggestions(
        weakArea,
        relevantCourses,
        assignmentTopic
      ),
      quality_score: 0,
      naturalness_rating: 'medium'
    };

    // Calculate quality score
    integration.quality_score = calculateIntegrationQuality(
      weakArea,
      relevantCourses,
      assignmentTopic
    );

    // Determine naturalness
    if (integration.quality_score >= 80) {
      integration.naturalness_rating = 'high';
    } else if (integration.quality_score >= 50) {
      integration.naturalness_rating = 'medium';
    } else {
      integration.naturalness_rating = 'low';
    }

    // Only include medium and high quality integrations
    if (integration.naturalness_rating !== 'low') {
      integrations.push(integration);
    }
  }

  return integrations.sort((a, b) => b.quality_score - a.quality_score);
}

function generateIntegrationSuggestions(
  weakArea: WeakArea,
  targetCourses: Array<{ subject: string; title: string }>,
  topic: string
): string[] {
  const suggestions: string[] = [];
  
  const subjectPairs: Record<string, Record<string, string[]>> = {
    'Math': {
      'English': [
        'Use mathematical concepts in word problems that require written explanations',
        'Create data visualizations and write analytical essays about the data',
        'Calculate statistics from literature (word counts, reading rates, etc.)'
      ],
      'Science': [
        'Apply mathematical formulas to scientific experiments and data analysis',
        'Calculate measurements, ratios, and conversions in lab activities',
        'Create graphs and charts to represent scientific findings'
      ],
      'Social Studies': [
        'Analyze historical data using statistical methods',
        'Calculate economic indicators and create financial models',
        'Map geographical data using coordinate systems and scale'
      ]
    },
    'English': {
      'Math': [
        'Write detailed explanations of mathematical problem-solving processes',
        'Create word problems based on real-world scenarios',
        'Document mathematical discoveries through written reports'
      ],
      'Science': [
        'Write lab reports and scientific explanations',
        'Create persuasive arguments using scientific evidence',
        'Analyze scientific texts for comprehension and critical thinking'
      ],
      'Social Studies': [
        'Analyze primary source documents and historical texts',
        'Write research papers on historical topics',
        'Create narratives based on historical events'
      ]
    },
    'Science': {
      'Math': [
        'Use scientific data for mathematical modeling and analysis',
        'Apply physics and chemistry formulas in calculations',
        'Measure and quantify scientific phenomena'
      ],
      'English': [
        'Document scientific observations through detailed writing',
        'Present scientific findings in written reports',
        'Explain complex scientific concepts in clear language'
      ]
    }
  };

  for (const course of targetCourses) {
    const pairSuggestions = subjectPairs[weakArea.subject]?.[course.subject] || [];
    suggestions.push(...pairSuggestions);
  }

  return suggestions.length > 0 
    ? suggestions.slice(0, 3) 
    : [`Incorporate ${weakArea.subject} concepts into ${targetCourses[0].subject} activities`];
}

function calculateIntegrationQuality(
  weakArea: WeakArea,
  targetCourses: Array<{ subject: string }>,
  topic: string
): number {
  let score = 50; // Base score

  // Subject compatibility
  const compatiblePairs = [
    ['Math', 'Science'],
    ['Math', 'Social Studies'],
    ['English', 'Social Studies'],
    ['English', 'Science'],
    ['Science', 'Math']
  ];

  for (const course of targetCourses) {
    const isPairCompatible = compatiblePairs.some(pair => 
      (pair[0] === weakArea.subject && pair[1] === course.subject) ||
      (pair[1] === weakArea.subject && pair[0] === course.subject)
    );
    if (isPairCompatible) score += 20;
  }

  // Priority bonus (higher priority weak areas get better scores)
  score += Math.min(weakArea.priority_score * 0.2, 20);

  // Recent practice bonus (recent failures indicate immediate need)
  if (weakArea.recent_attempts > 0) score += 10;

  return Math.min(Math.round(score), 100);
}
