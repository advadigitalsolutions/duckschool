export interface CourseScope {
  allow_prefixes: string[];
  ban_prefixes: string[];
  ban_terms_core_only: string[];
  concept_tags: string[];
  grade_range: [number, number];
}

/**
 * Normalize course key to try multiple formats for robust lookup
 * Converts single grades to ranges where appropriate (e.g., 9 -> 9-10, 11 -> 11-12)
 */
export function normalizeCourseKey(context: {
  state: string;
  class_name: string;
  grade_level: string | number;
}): string[] {
  const g = String(context.grade_level);
  
  // Map single grades to standard ranges
  const ranges: Record<string, string> = {
    "9": "9-10", "10": "9-10",
    "11": "11-12", "12": "11-12"
  };
  const range = ranges[g] ?? g;

  return [
    `${context.state}:${context.class_name}:${range}`,     // Preferred: with range
    `${context.state}:${context.class_name}:${g}`,         // Fallback 1: exact grade
    `${context.state}:${context.class_name}`               // Fallback 2: course only
  ];
}

export const COURSE_SCOPE_MAP: Record<string, CourseScope> = {
  "CA:Algebra I:9-10": {
    allow_prefixes: ["HSA-", "HSF-", "S-ID"],
    ban_prefixes: ["K.", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "NBT", "NS", "EE", "4.NBT", "5.NBT", "6.NS", "7.NS", "8.NS"],
    ban_terms_core_only: [
      "place value", "base-10", "ten frame", "expanded form", 
      "rounding", "regrouping", "unifix cubes", "skip counting",
      "counting by tens", "number line for addition", "base-ten blocks"
    ],
    concept_tags: [
      "linear equations", "functions", "systems", "polynomials", 
      "exponents", "modeling", "statistics-linear", "quadratics"
    ],
    grade_range: [9, 10]
  },
  "CA:Geometry:9-10": {
    allow_prefixes: ["HSG-", "HSA-REI", "HSF-TF"],
    ban_prefixes: ["K.", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8."],
    ban_terms_core_only: ["pattern blocks", "shape sorting", "counting shapes"],
    concept_tags: ["congruence", "similarity", "trigonometry", "circles", "proofs"],
    grade_range: [9, 10]
  },
  "CA:Algebra II:11-12": {
    allow_prefixes: ["HSA-", "HSF-", "HSN-", "S-"],
    ban_prefixes: ["K.", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8."],
    ban_terms_core_only: ["manipulatives", "visual models for fractions"],
    concept_tags: [
      "complex numbers", "rational expressions", "exponential functions",
      "logarithms", "trigonometry", "sequences", "series"
    ],
    grade_range: [11, 12]
  },
  "CA:Grade 5 Math:5": {
    allow_prefixes: ["5.NBT", "5.NF", "5.MD", "5.OA"],
    ban_prefixes: ["HSA-", "HSF-", "HSG-", "HSN-", "6.", "7.", "8."],
    ban_terms_core_only: ["matrix", "determinant", "epsilon-delta", "complex numbers"],
    concept_tags: ["place value", "operations", "fractions", "measurement", "patterns"],
    grade_range: [5, 5]
  },
  "CA:Grade 8 Math:8": {
    allow_prefixes: ["8.NS", "8.EE", "8.F", "8.G", "8.SP"],
    ban_prefixes: ["HSA-", "HSF-", "1.", "2.", "3.", "4.", "5.", "6.", "7."],
    ban_terms_core_only: ["counting blocks", "unifix cubes"],
    concept_tags: ["rational numbers", "linear equations", "functions", "geometry", "pythagorean"],
    grade_range: [8, 8]
  }
};

/**
 * Resolve course scope dynamically if not in map
 * Now used as fallback after trying all normalized keys
 */
export function resolveCourseScope(
  courseName: string,
  state: string,
  gradeLevel: string,
  subject: string
): CourseScope | null {
  const key = `${state}:${courseName}:${gradeLevel}`;
  
  if (COURSE_SCOPE_MAP[key]) return COURSE_SCOPE_MAP[key];
  
  const gradeNum = parseInt(gradeLevel) || 12;
  
  if (subject === "Mathematics" && gradeNum >= 9) {
    return {
      allow_prefixes: ["HSA-", "HSF-", "HSG-", "HSN-", "S-"],
      ban_prefixes: ["K.", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8."],
      ban_terms_core_only: ["place value", "base-10", "counting blocks"],
      concept_tags: ["algebra", "functions", "geometry"],
      grade_range: [9, 12]
    };
  } else if (subject === "Mathematics" && gradeNum <= 8) {
    return {
      allow_prefixes: [`${gradeNum}.`],
      ban_prefixes: ["HSA-", "HSF-", "HSG-"],
      ban_terms_core_only: ["epsilon-delta", "matrix"],
      concept_tags: ["arithmetic", "fractions", "basic algebra"],
      grade_range: [gradeNum, gradeNum]
    };
  }
  
  return null;
}
