export interface StandardRigorPrior {
  code: string;
  minDOK: number; // Depth of Knowledge 1-4
  minBloom: number; // Bloom's 1-6 (Remember to Create)
  requires: string[]; // Required question types
  typical_verbs: string[];
}

export const STANDARDS_RIGOR_PRIORS: Record<string, StandardRigorPrior> = {
  // High School Algebra
  "HSA-REI.B.3": {
    code: "HSA-REI.B.3",
    minDOK: 2.5,
    minBloom: 3, // Apply
    requires: ["multi_step_linear", "equation_solving"],
    typical_verbs: ["solve", "determine", "find"]
  },
  "HSA-CED.A.1": {
    code: "HSA-CED.A.1",
    minDOK: 3.0,
    minBloom: 6, // Create
    requires: ["create_equation_from_context", "constraints"],
    typical_verbs: ["create", "write", "formulate", "design"]
  },
  "HSA-CED.A.2": {
    code: "HSA-CED.A.2",
    minDOK: 3.0,
    minBloom: 6, // Create
    requires: ["create_equation_from_context", "constraints"],
    typical_verbs: ["create", "write", "formulate", "design"]
  },
  "HSA-SSE.A.1": {
    code: "HSA-SSE.A.1",
    minDOK: 2.5,
    minBloom: 4, // Analyze
    requires: ["interpret_expressions", "structure_analysis"],
    typical_verbs: ["interpret", "analyze", "identify"]
  },
  
  // High School Functions
  "HSF-IF.B.6": {
    code: "HSF-IF.B.6",
    minDOK: 3.0,
    minBloom: 4, // Analyze
    requires: ["rate_of_change_from_graph", "interpretation"],
    typical_verbs: ["analyze", "interpret", "calculate", "determine"]
  },
  "HSF-LE.A.1": {
    code: "HSF-LE.A.1",
    minDOK: 3.0,
    minBloom: 5, // Evaluate/Synthesize
    requires: ["modeling_context", "real_world_application"],
    typical_verbs: ["model", "construct", "represent", "distinguish"]
  },
  "HSF-IF.C.7": {
    code: "HSF-IF.C.7",
    minDOK: 2.5,
    minBloom: 4, // Analyze
    requires: ["graphing", "function_features"],
    typical_verbs: ["graph", "analyze", "show"]
  },
  "HSF-BF.A.1": {
    code: "HSF-BF.A.1",
    minDOK: 3.0,
    minBloom: 6, // Create
    requires: ["build_functions", "modeling"],
    typical_verbs: ["write", "build", "construct"]
  },
  
  // High School Geometry
  "HSG-CO.A.1": {
    code: "HSG-CO.A.1",
    minDOK: 2.0,
    minBloom: 2, // Understand
    requires: ["geometric_definitions"],
    typical_verbs: ["define", "identify", "recognize"]
  },
  "HSG-SRT.B.5": {
    code: "HSG-SRT.B.5",
    minDOK: 3.0,
    minBloom: 3, // Apply
    requires: ["similarity_proofs", "geometric_reasoning"],
    typical_verbs: ["prove", "use", "demonstrate"]
  },
  
  // Elementary Standards (for contrast)
  "5.NBT.A.1": {
    code: "5.NBT.A.1",
    minDOK: 1.5,
    minBloom: 2, // Understand
    requires: ["place_value_recognition"],
    typical_verbs: ["recognize", "identify", "explain"]
  },
  "5.NF.B.3": {
    code: "5.NF.B.3",
    minDOK: 2.0,
    minBloom: 3, // Apply
    requires: ["fraction_division"],
    typical_verbs: ["interpret", "compute", "solve"]
  },
  "5.OA.A.2": {
    code: "5.OA.A.2",
    minDOK: 2.5,
    minBloom: 5, // Evaluate
    requires: ["expression_writing", "pattern_analysis"],
    typical_verbs: ["write", "generate", "analyze"]
  },
  
  // Middle School Standards
  "8.EE.B.6": {
    code: "8.EE.B.6",
    minDOK: 2.0,
    minBloom: 4, // Analyze
    requires: ["slope_interpretation", "linear_functions"],
    typical_verbs: ["derive", "use", "interpret"]
  },
  "8.F.A.3": {
    code: "8.F.A.3",
    minDOK: 2.5,
    minBloom: 4, // Analyze
    requires: ["function_analysis", "linear_vs_nonlinear"],
    typical_verbs: ["interpret", "compare", "recognize"]
  }
};

/**
 * Get rigor prior for a standard code, or default values if not found
 */
export function getStandardRigorPrior(code: string): StandardRigorPrior {
  if (STANDARDS_RIGOR_PRIORS[code]) {
    return STANDARDS_RIGOR_PRIORS[code];
  }
  
  // Default fallback based on standard prefix
  if (code.startsWith('HS')) {
    return {
      code,
      minDOK: 2.5,
      minBloom: 3,
      requires: [],
      typical_verbs: ["analyze", "apply", "solve"]
    };
  } else if (code.match(/^[6-8]\./)) {
    return {
      code,
      minDOK: 2.0,
      minBloom: 3,
      requires: [],
      typical_verbs: ["apply", "use", "solve"]
    };
  } else {
    return {
      code,
      minDOK: 1.5,
      minBloom: 2,
      requires: [],
      typical_verbs: ["identify", "explain", "understand"]
    };
  }
}
