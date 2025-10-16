export interface DayGateResult {
  approval_status: 'approved' | 'corrected' | 'rejected' | 'override_approved';
  alignment_confidence: 'high' | 'medium' | 'low';
  findings: string[];
}

export interface WeekValidationSummary {
  totals: {
    approved: number;
    corrected: number;
    rejected: number;
    override_approved: number;
  };
  confidence: {
    high: number;
    medium: number;
    low: number;
  };
  pass_rate: number;
  flagged_rate: number;
  total_assignments: number;
  critical_findings: string[];
}

/**
 * Aggregate daily validation results into weekly summary for parent dashboard
 */
export function summarizeWeekValidation(
  dayResults: DayGateResult[]
): WeekValidationSummary {
  const totals = { approved: 0, corrected: 0, rejected: 0, override_approved: 0 };
  const confidence = { high: 0, medium: 0, low: 0 };
  const criticalFindings: string[] = [];

  for (const result of dayResults) {
    totals[result.approval_status] = (totals[result.approval_status] || 0) + 1;
    confidence[result.alignment_confidence] = (confidence[result.alignment_confidence] || 0) + 1;
    
    if (result.approval_status === 'rejected') {
      criticalFindings.push(...result.findings);
    }
  }

  const total = dayResults.length || 1;

  return {
    totals,
    confidence,
    pass_rate: (totals.approved + totals.corrected) / total,
    flagged_rate: totals.rejected / total,
    total_assignments: total,
    critical_findings: [...new Set(criticalFindings)] // dedupe
  };
}
