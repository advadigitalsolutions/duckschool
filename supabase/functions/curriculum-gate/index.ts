import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { COURSE_SCOPE_MAP, resolveCourseScope, normalizeCourseKey } from "../_shared/course-scope-map.ts";
import { analyzeRigor } from '../_shared/rigor-analyzer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationContext {
  course_key?: string;
  class_name: string;
  state: string;
  grade_band: string;
  subject: string;
  learner_profile?: any;
  mode: "generation" | "storage" | "prepublish";
}

interface ValidationResult {
  approval_status: "approved" | "corrected" | "rejected" | "override_approved";
  alignment_confidence: "high" | "medium" | "low";
  findings: string[];
  corrections_applied: string[];
  validated_lesson: any | null;
  course_key_matched?: string;
  validated_at?: string;
  regenerate_with_fixes?: {
    reason: string;
    required_scope: {
      allow_prefixes: string[];
      ban_terms: string[];
    };
    notes: string[];
  };
  audit: {
    checked_at: string;
    checked_by: string;
    override: { by: string | null; reason: string | null };
  };
  alignment_proof?: {
    course_key: string;
    evidence: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lesson_json, context } = await req.json() as {
      lesson_json: any;
      context: ValidationContext;
    };

    console.log("🔍 Curriculum Gate: Starting validation", {
      class: context.class_name,
      mode: context.mode
    });

    // Step 1: Determine course scope with normalized keys
    const courseKeys = normalizeCourseKey({
      state: context.state,
      class_name: context.class_name,
      grade_level: context.grade_band // Using grade_band from context
    });
    
    let courseScope = null;
    let matchedKey = null;
    
    // Try all normalized keys before falling back to dynamic resolver
    for (const key of courseKeys) {
      if (COURSE_SCOPE_MAP[key]) {
        courseScope = COURSE_SCOPE_MAP[key];
        matchedKey = key;
        console.log(`✅ Exact match found: ${key}`);
        break;
      }
    }
    
    if (!courseScope) {
      console.log(`⚠️ No exact scope match for keys: ${courseKeys.join(', ')}, using dynamic resolver`);
      courseScope = resolveCourseScope(context.class_name, context.state, context.grade_band, context.subject);
      matchedKey = 'dynamic_fallback';
    }

    if (!courseScope) {
      console.warn("⚠️ No scope found, using lenient validation");
      return new Response(JSON.stringify({
        approval_status: "approved",
        alignment_confidence: "low",
        findings: ["No specific scope defined for this course"],
        corrections_applied: [],
        validated_lesson: lesson_json,
        course_key_matched: 'none',
        validated_at: new Date().toISOString(),
        audit: {
          checked_at: new Date().toISOString(),
          checked_by: "CurriculumGate@v1",
          override: { by: null, reason: null }
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const findings: string[] = [];
    const corrections: string[] = [];
    let status: ValidationResult['approval_status'] = "approved";
    let confidence: ValidationResult['alignment_confidence'] = "high";

    // Step 2: Schema Check
    const requiredFields = [
      'objective', 'standards_aligned', 'lesson_core', 
      'practice_items', 'assessment', 'metadata'
    ];
    
    for (const field of requiredFields) {
      if (!lesson_json[field]) {
        findings.push(`Missing required field: ${field}`);
        status = "rejected";
      }
    }

    // Check that practice and assessment items have answers
    if (lesson_json.practice_items) {
      const missingAnswers = lesson_json.practice_items.filter((item: any) => !item.a && !item.answer);
      if (missingAnswers.length > 0) {
        findings.push(`${missingAnswers.length} practice items missing answers`);
        status = "rejected";
      }
    }

    if (lesson_json.assessment) {
      const missingAnswers = lesson_json.assessment.filter((item: any) => !item.a && !item.answer);
      if (missingAnswers.length > 0) {
        findings.push(`${missingAnswers.length} assessment items missing answers`);
        status = "rejected";
      }
    }

    // Step 3: Standards Code Check
    const alignedStandards = lesson_json.standards_aligned || [];
    const invalidCodes: string[] = [];
    const bannedCodes: string[] = [];
    const validCodes: string[] = [];

    for (const std of alignedStandards) {
      const code = std.code || std;
      
      // Check if code starts with banned prefix
      const isBanned = courseScope.ban_prefixes.some(prefix => code.startsWith(prefix));
      if (isBanned) {
        bannedCodes.push(code);
        findings.push(`Banned code for this course: ${code}`);
        continue;
      }

      // Check if code starts with allowed prefix
      const isAllowed = courseScope.allow_prefixes.some(prefix => code.startsWith(prefix));
      if (!isAllowed) {
        invalidCodes.push(code);
        findings.push(`Code outside allowed scope: ${code}`);
      } else {
        validCodes.push(code);
      }
    }

    if (bannedCodes.length > 0 || invalidCodes.length > 0) {
      status = "rejected";
      confidence = "low";
    }

    // Step 4: Content Scan for Banned Terms
    const textToScan = [
      JSON.stringify(lesson_json.lesson_core || {}),
      JSON.stringify(lesson_json.practice_items || []),
      JSON.stringify(lesson_json.assessment || [])
    ].join(" ").toLowerCase();

    const foundBannedTerms: string[] = [];
    for (const term of courseScope.ban_terms_core_only) {
      if (textToScan.includes(term.toLowerCase())) {
        foundBannedTerms.push(term);
        findings.push(`Banned term found in core content: "${term}"`);
      }
    }

    if (foundBannedTerms.length > 0) {
      status = "rejected";
      confidence = "low";
    }

    // Step 5: Enhanced Rigor Analysis
    if (validCodes.length > 0 && context.mode === "generation") {
      const gradeNum = parseInt(context.grade_band) || 12;
      const rigorAnalysis = analyzeRigor(lesson_json, validCodes, gradeNum);
      
      console.log("📊 Rigor analysis:", {
        overall_score: rigorAnalysis.overall_score.toFixed(2),
        breakdown: rigorAnalysis.breakdown,
        recommendations: rigorAnalysis.recommendations
      });
      
      console.log("📊 Rigor analysis:", {
        overall_score: rigorAnalysis.overall_score.toFixed(2),
        breakdown: rigorAnalysis.breakdown,
        recommendations: rigorAnalysis.recommendations
      });
      
      if (rigorAnalysis.overall_score < 0.6) {
        findings.push(`Rigor score too low: ${rigorAnalysis.overall_score.toFixed(2)}/1.0`);
        findings.push(...rigorAnalysis.recommendations);
        
        if (rigorAnalysis.overall_score < 0.4) {
          status = "rejected";
        } else if (status === "approved") {
          status = "corrected";
          corrections.push("Enhanced rigor: " + rigorAnalysis.recommendations[0]);
        }
        
        if (confidence === "high") {
          confidence = rigorAnalysis.overall_score >= 0.5 ? "medium" : "low";
        }
      }
    }

    // Step 6: Build regeneration feedback if rejected
    let regenerateFeedback = undefined;
    if (status === "rejected") {
      regenerateFeedback = {
        reason: findings.join("; "),
        required_scope: {
          allow_prefixes: courseScope.allow_prefixes,
          ban_terms: courseScope.ban_terms_core_only
        },
        notes: [
          "Use only standards with allowed prefixes",
          "Remove banned terms from core instruction",
          "Move prerequisite content to bridge_support (≤10 min)",
          validCodes.length > 0 
            ? `Keep these valid codes: ${validCodes.join(", ")}`
            : "Ensure at least one valid standard is aligned"
        ]
      };
    }

    // Step 7: Build alignment proof
    const alignmentProof = validCodes.length > 0 ? {
      course_key: context.course_key || `${context.state}:${context.class_name}:${context.grade_band}`,
      evidence: validCodes.map(code => {
        const std = alignedStandards.find((s: any) => (s.code || s) === code);
        return `${code} → ${std?.name || std?.text || "aligned"}`;
      })
    } : undefined;

    const result: ValidationResult = {
      approval_status: status,
      alignment_confidence: confidence,
      findings,
      corrections_applied: corrections,
      validated_lesson: status !== "rejected" ? lesson_json : null,
      course_key_matched: matchedKey || 'none',
      validated_at: new Date().toISOString(),
      regenerate_with_fixes: regenerateFeedback,
      audit: {
        checked_at: new Date().toISOString(),
        checked_by: "CurriculumGate@v1",
        override: { by: null, reason: null }
      },
      alignment_proof: alignmentProof
    };

    console.log("✅ Validation complete:", {
      status,
      findings: findings.length,
      validCodes: validCodes.length
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ Curriculum Gate error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      approval_status: "rejected"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
