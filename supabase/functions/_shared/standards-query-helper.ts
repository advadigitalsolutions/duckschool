/**
 * Helper function to query standards with flexible framework and subject matching
 * Handles variations like "CA-CCSS" vs "CA CCSS" and "English/Language Arts" vs "English Language Arts"
 */

interface StandardsQueryOptions {
  supabase: any;
  framework: string;
  subject?: string;
  gradeLevel?: string;
  gradeBands?: string[];
  select?: string;
  limit?: number;
  additionalFilters?: (query: any) => any;
}

export async function queryStandardsFlexible(options: StandardsQueryOptions): Promise<any[]> {
  const {
    supabase,
    framework,
    subject,
    gradeLevel,
    gradeBands,
    select = '*',
    limit,
    additionalFilters
  } = options;

  // Normalize framework names - handle both "CA-CCSS" and "CA CCSS" formats
  const frameworkVariations = [
    framework,
    framework?.replace(/-/g, ' '), // "CA-CCSS" -> "CA CCSS"
    framework?.replace(/ /g, '-'), // "CA CCSS" -> "CA-CCSS"
  ].filter(Boolean);

  // Normalize subject names if provided
  const subjectVariations = subject ? [
    subject,
    subject.replace(/\//g, ' '), // "English/Language Arts" -> "English Language Arts"
    subject.replace(/ /g, '/'),   // "English Language Arts" -> "English/Language Arts"
  ] : [null];

  console.log('🔍 Querying standards with variations:', {
    framework,
    frameworkVariations,
    subject,
    subjectVariations,
    gradeLevel,
    gradeBands
  });

  // Try all framework and subject combinations
  for (const frameworkVariant of frameworkVariations) {
    for (const subjectVariant of subjectVariations) {
      let query = supabase
        .from('standards')
        .select(select)
        .eq('framework', frameworkVariant);

      if (subjectVariant) {
        query = query.eq('subject', subjectVariant);
      }

      // Apply grade level or grade bands filter
      if (gradeBands && gradeBands.length > 0) {
        query = query.in('grade_band', gradeBands);
      } else if (gradeLevel) {
        const gradeNum = parseInt(gradeLevel.toString().replace(/\D/g, ''));
        if (!isNaN(gradeNum)) {
          query = query.or(`grade_band.eq.${gradeNum},grade_band.like.%${gradeNum}%,grade_band.eq.K-12`);
        }
      }

      // Apply any additional custom filters
      if (additionalFilters) {
        query = additionalFilters(query);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Standards query error:', error);
      }

      if (data && data.length > 0) {
        console.log('✅ Found standards:', {
          count: data.length,
          framework: frameworkVariant,
          subject: subjectVariant
        });
        return data;
      }
    }
  }

  console.log('⚠️ No standards found for any combination');
  return [];
}
