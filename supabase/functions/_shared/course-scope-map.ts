export interface CourseScope {
  allowPrefixes: string[];
  bannedPrefixes: string[];
  bannedTerms: string[];
  conceptTags: string[];
  gradeRange: { min: number; max: number };
}

export const COURSE_SCOPE_MAP: Record<string, CourseScope> = {
  // Mathematics - High School
  "algebra_1": {
    allowPrefixes: ["A.SSE", "A.APR", "A.CED", "A.REI", "F.IF", "F.BF", "F.LE", "S.ID"],
    bannedPrefixes: ["G.", "N.CN", "N.VM", "F.TF", "K.", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8."],
    bannedTerms: ["triangle", "polygon", "circle", "angle", "congruent", "similar", "geometry", "place value", "base-10", "counting"],
    conceptTags: ["algebra", "equations", "functions", "linear", "quadratic"],
    gradeRange: { min: 8, max: 10 }
  },
  
  "geometry": {
    allowPrefixes: ["G.CO", "G.SRT", "G.C", "G.GPE", "G.GMD", "G.MG"],
    bannedPrefixes: ["A.", "F.", "S.", "N.", "K.", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8."],
    bannedTerms: ["algebra", "function", "equation", "variable", "counting", "place value"],
    conceptTags: ["geometry", "shapes", "proofs", "constructions", "measurement"],
    gradeRange: { min: 9, max: 11 }
  },
  
  "algebra_2": {
    allowPrefixes: ["A.SSE", "A.APR", "A.CED", "A.REI", "F.IF", "F.BF", "F.TF", "N.CN", "N.VM"],
    bannedPrefixes: ["G.", "K.", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8."],
    bannedTerms: ["triangle", "polygon", "circle", "angle", "congruent", "elementary", "counting"],
    conceptTags: ["algebra", "functions", "polynomials", "rational", "exponential", "logarithmic"],
    gradeRange: { min: 10, max: 12 }
  },
  
  "precalculus": {
    allowPrefixes: ["F.TF", "N.CN", "N.VM", "A.APR"],
    bannedPrefixes: ["G.CO", "G.SRT", "K.", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8."],
    bannedTerms: ["elementary", "basic arithmetic", "counting", "place value"],
    conceptTags: ["trigonometry", "complex numbers", "vectors", "matrices", "advanced functions"],
    gradeRange: { min: 11, max: 12 }
  },
  
  "calculus": {
    allowPrefixes: ["calculus", "derivative", "integral", "limit", "F."],
    bannedPrefixes: ["K.", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8."],
    bannedTerms: ["elementary", "basic arithmetic", "counting", "place value"],
    conceptTags: ["calculus", "derivatives", "integrals", "limits", "applications"],
    gradeRange: { min: 11, max: 12 }
  },
  
  "statistics": {
    allowPrefixes: ["S.ID", "S.IC", "S.CP", "S.MD"],
    bannedPrefixes: ["A.", "G.", "F.IF", "F.BF", "K.", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8."],
    bannedTerms: ["algebra", "geometry", "triangle", "elementary"],
    conceptTags: ["statistics", "probability", "data analysis", "inference"],
    gradeRange: { min: 11, max: 12 }
  },
  
  "pre_algebra": {
    allowPrefixes: ["6.NS", "6.EE", "6.G", "7.NS", "7.EE", "7.G", "8.NS", "8.EE", "8.G", "8.F"],
    bannedPrefixes: ["A.", "G.CO", "G.SRT", "N.CN", "F.TF"],
    bannedTerms: ["calculus", "derivative", "trigonometry", "matrix"],
    conceptTags: ["pre-algebra", "ratios", "expressions", "integers", "basic geometry"],
    gradeRange: { min: 6, max: 8 }
  },
  
  // Mathematics - General
  "general_math": {
    allowPrefixes: [],
    bannedPrefixes: [],
    bannedTerms: [],
    conceptTags: ["mathematics"],
    gradeRange: { min: 0, max: 12 }
  },
};

/**
 * Get course scope by course type key
 */
export function getCourseScope(courseType: string | null | undefined): CourseScope | null {
  if (!courseType) return null;
  return COURSE_SCOPE_MAP[courseType] || null;
}
