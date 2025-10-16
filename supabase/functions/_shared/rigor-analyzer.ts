import { STANDARDS_RIGOR_PRIORS, getStandardRigorPrior } from './standards-rigor-priors.ts';

export interface RigorAnalysis {
  overall_score: number; // 0-1
  question_type_score: number;
  bloom_score: number;
  standards_prior_score: number;
  structure_score: number;
  breakdown: {
    question_types: Record<string, number>;
    bloom_levels: Record<string, number>;
    steps_per_problem: number;
    has_representations: boolean;
    has_modeling: boolean;
  };
  recommendations: string[];
}

/**
 * Analyze content rigor using multiple signals
 */
export function analyzeRigor(
  lessonContent: any,
  standardsCodes: string[],
  gradeLevel: number
): RigorAnalysis {
  const isHighSchool = gradeLevel >= 9;
  
  // 1. Question Type Mix Analysis
  const questionTypes = classifyQuestionTypes(lessonContent);
  const questionTypeScore = scoreQuestionTypeMix(questionTypes, isHighSchool);
  
  // 2. Bloom/DOK Classification
  const bloomLevels = classifyBloomLevels(lessonContent);
  const bloomScore = scoreBloomDistribution(bloomLevels, isHighSchool);
  
  // 3. Standards Prior Check
  const standardsPriorScore = checkStandardsPriors(standardsCodes, lessonContent);
  
  // 4. Structural Signals
  const structureScore = analyzeStructuralComplexity(lessonContent);
  
  // Weighted combination
  const overall = 
    0.35 * questionTypeScore +
    0.30 * bloomScore +
    0.25 * standardsPriorScore +
    0.10 * structureScore;

  const recommendations = generateRecommendations(
    overall,
    questionTypeScore,
    bloomScore,
    standardsPriorScore,
    structureScore,
    isHighSchool
  );

  return {
    overall_score: overall,
    question_type_score: questionTypeScore,
    bloom_score: bloomScore,
    standards_prior_score: standardsPriorScore,
    structure_score: structureScore,
    breakdown: {
      question_types: questionTypes,
      bloom_levels: bloomLevels,
      steps_per_problem: calculateAverageSteps(lessonContent),
      has_representations: hasMultipleRepresentations(lessonContent),
      has_modeling: hasModelingItems(lessonContent)
    },
    recommendations
  };
}

// Helper: Classify question types based on structure
function classifyQuestionTypes(content: any): Record<string, number> {
  const types = {
    recall: 0,
    procedural: 0,
    conceptual: 0,
    application: 0,
    modeling: 0
  };

  const allQuestions = [
    ...(content.practice_items || []),
    ...(content.assessment || [])
  ];

  for (const q of allQuestions) {
    const text = (q.q || q.question || '').toLowerCase();
    
    // Pattern matching for question types
    if (text.match(/what is|define|identify|list|name/)) types.recall++;
    else if (text.match(/real.world|scenario|situation|context|application/)) types.application++;
    else if (text.match(/model|represent|construct|design|create/)) types.modeling++;
    else if (text.match(/explain why|compare|analyze|interpret/)) types.conceptual++;
    else if (text.match(/calculate|solve|find the value|compute/)) types.procedural++;
    else types.procedural++; // default
  }

  return types;
}

// Helper: Bloom classification
function classifyBloomLevels(content: any): Record<string, number> {
  const levels = {
    remember: 0,    // 1
    understand: 0,  // 2
    apply: 0,       // 3
    analyze: 0,     // 4
    evaluate: 0,    // 5
    create: 0       // 6
  };

  const bloomVerbs = {
    remember: ['define', 'list', 'recall', 'identify', 'name', 'state'],
    understand: ['explain', 'describe', 'summarize', 'interpret', 'classify'],
    apply: ['calculate', 'solve', 'use', 'demonstrate', 'implement', 'compute'],
    analyze: ['compare', 'contrast', 'examine', 'investigate', 'analyze', 'distinguish'],
    evaluate: ['justify', 'critique', 'assess', 'judge', 'evaluate', 'argue'],
    create: ['design', 'construct', 'create', 'formulate', 'model', 'develop', 'build']
  };

  const allText = JSON.stringify(content).toLowerCase();
  
  for (const [level, verbs] of Object.entries(bloomVerbs)) {
    for (const verb of verbs) {
      const regex = new RegExp(`\\b${verb}\\b`, 'g');
      const matches = allText.match(regex);
      if (matches) levels[level as keyof typeof levels] += matches.length;
    }
  }

  return levels;
}

// Helper: Score against target distribution
function scoreQuestionTypeMix(types: Record<string, number>, isHS: boolean): number {
  const total = Object.values(types).reduce((a, b) => a + b, 1);
  const dist = Object.fromEntries(
    Object.entries(types).map(([k, v]) => [k, v / total])
  );

  if (isHS) {
    // HS targets: modeling ≥15%, application ≥25%, recall ≤20%
    let score = 1.0;
    if (dist.modeling < 0.15) score -= 0.3;
    if (dist.application < 0.25) score -= 0.2;
    if (dist.recall > 0.20) score -= 0.3;
    return Math.max(0, score);
  } else {
    // Elementary: more recall/procedural is OK
    return dist.procedural >= 0.4 ? 0.8 : 0.6;
  }
}

// Helper: Score Bloom distribution
function scoreBloomDistribution(levels: Record<string, number>, isHS: boolean): number {
  const total = Object.values(levels).reduce((a, b) => a + b, 1);
  const weights = { remember: 1, understand: 2, apply: 3, analyze: 4, evaluate: 5, create: 6 };
  
  const avgBloom = Object.entries(levels).reduce((sum, [level, count]) => {
    return sum + (weights[level as keyof typeof weights] * count);
  }, 0) / total;

  if (isHS) {
    // HS target: avg Bloom ≥ 3.5 (between Apply and Analyze)
    return Math.min(1.0, avgBloom / 3.5);
  } else {
    // Elementary target: avg Bloom ≥ 2.0 (Understand)
    return Math.min(1.0, avgBloom / 2.0);
  }
}

// Helper: Check standards priors
function checkStandardsPriors(codes: string[], content: any): number {
  if (codes.length === 0) return 0.5; // neutral if no codes

  let totalPriorScore = 0;
  let priorCount = 0;

  for (const code of codes) {
    const prior = getStandardRigorPrior(code);
    priorCount++;
    
    const contentText = JSON.stringify(content).toLowerCase();
    
    // Check if required question types are present
    const hasRequired = prior.requires.length === 0 || prior.requires.some(req => 
      contentText.includes(req.replace(/_/g, ' '))
    );

    // Check if typical verbs are present
    const hasTypicalVerbs = prior.typical_verbs.some(verb =>
      new RegExp(`\\b${verb}\\b`).test(contentText)
    );

    const score = (hasRequired ? 0.7 : 0.3) + (hasTypicalVerbs ? 0.3 : 0);
    totalPriorScore += score;
  }

  return priorCount > 0 ? totalPriorScore / priorCount : 0.7; // default OK
}

// Helper: Structural complexity
function analyzeStructuralComplexity(content: any): number {
  let score = 0.5; // baseline

  // Check for multi-step solutions
  const avgSteps = calculateAverageSteps(content);
  if (avgSteps >= 3) score += 0.2;

  // Check for multiple representations
  if (hasMultipleRepresentations(content)) score += 0.2;

  // Check for constraints/parameters in modeling
  const text = JSON.stringify(content).toLowerCase();
  if (text.match(/constraint|parameter|condition|requirement/)) score += 0.1;

  return Math.min(1.0, score);
}

function calculateAverageSteps(content: any): number {
  // Rough heuristic: count semicolons + "then" + "next" in solutions
  const solutions = (content.practice_items || []).map((item: any) => item.a || item.answer || '').join(' ');
  const stepIndicators = (solutions.match(/;|then|next|step/gi) || []).length;
  const itemCount = (content.practice_items || []).length || 1;
  return stepIndicators / itemCount;
}

function hasMultipleRepresentations(content: any): boolean {
  const text = JSON.stringify(content).toLowerCase();
  const representations = ['graph', 'table', 'equation', 'diagram', 'chart'];
  const found = representations.filter(rep => text.includes(rep));
  return found.length >= 2;
}

function hasModelingItems(content: any): boolean {
  const text = JSON.stringify(content).toLowerCase();
  return /model|represent|real.world|scenario/.test(text);
}

function generateRecommendations(
  overall: number,
  qtScore: number,
  bloomScore: number,
  priorScore: number,
  structureScore: number,
  isHighSchool: boolean
): string[] {
  const recs: string[] = [];

  if (overall < 0.6) {
    if (qtScore < 0.5) {
      if (isHighSchool) {
        recs.push("Add more application and modeling questions (target: 15% modeling, 25% application)");
      } else {
        recs.push("Ensure appropriate mix of procedural and conceptual questions");
      }
    }
    if (bloomScore < 0.5) {
      recs.push("Increase cognitive demand: add analysis, evaluation, or creation tasks");
    }
    if (priorScore < 0.5) {
      recs.push("Ensure questions align with expected complexity for the standards");
    }
    if (structureScore < 0.5) {
      recs.push("Add multi-step problems and multiple representations (graphs, tables, equations)");
    }
  }

  if (overall < 0.4) {
    recs.push("CRITICAL: Lesson rigor is too low for grade level. Major revision needed.");
  }

  return recs;
}
