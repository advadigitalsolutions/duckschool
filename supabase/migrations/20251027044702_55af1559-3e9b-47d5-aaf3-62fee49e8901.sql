-- Create table for standard prerequisites (knowledge graph)
CREATE TABLE IF NOT EXISTS public.standard_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_code TEXT NOT NULL,
  prerequisite_code TEXT NOT NULL,
  subject TEXT NOT NULL,
  sequence_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(standard_code, prerequisite_code)
);

-- Enable RLS
ALTER TABLE public.standard_prerequisites ENABLE ROW LEVEL SECURITY;

-- Anyone can read prerequisites (needed for question generation)
CREATE POLICY "Prerequisites readable by all authenticated users"
  ON public.standard_prerequisites
  FOR SELECT
  TO authenticated
  USING (true);

-- System can manage prerequisites
CREATE POLICY "System can manage prerequisites"
  ON public.standard_prerequisites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for efficient prerequisite lookups
CREATE INDEX idx_standard_prerequisites_code ON public.standard_prerequisites(standard_code);
CREATE INDEX idx_standard_prerequisites_subject ON public.standard_prerequisites(subject);

-- Seed with common Math progressions (elementary through middle school)
INSERT INTO public.standard_prerequisites (standard_code, prerequisite_code, subject, sequence_order) VALUES
-- Basic Math Progressions
('Addition - Multi-digit', 'Addition - Single-digit', 'Mathematics', 1),
('Subtraction - Multi-digit', 'Subtraction - Single-digit', 'Mathematics', 1),
('Multiplication - Basic', 'Addition - Multi-digit', 'Mathematics', 2),
('Division - Basic', 'Multiplication - Basic', 'Mathematics', 1),
('Fractions - Basic', 'Division - Basic', 'Mathematics', 1),
('Fractions - Operations', 'Fractions - Basic', 'Mathematics', 1),
('Fractions - Mixed Numbers', 'Fractions - Operations', 'Mathematics', 1),
('Decimals - Basic', 'Fractions - Basic', 'Mathematics', 1),
('Decimals - Operations', 'Decimals - Basic', 'Mathematics', 1),
('Percentages', 'Decimals - Operations', 'Mathematics', 1),
('Ratios and Proportions', 'Fractions - Operations', 'Mathematics', 1),

-- Algebra Progressions
('Algebra - Variables', 'Multiplication - Basic', 'Mathematics', 3),
('Algebra - Expressions', 'Algebra - Variables', 'Mathematics', 1),
('Algebra - Equations', 'Algebra - Expressions', 'Mathematics', 1),
('Algebra - Inequalities', 'Algebra - Equations', 'Mathematics', 1),
('Algebra - Systems', 'Algebra - Equations', 'Mathematics', 2),

-- Geometry Progressions
('Geometry - Shapes', 'Counting', 'Mathematics', 1),
('Geometry - Area', 'Multiplication - Basic', 'Mathematics', 2),
('Geometry - Perimeter', 'Addition - Multi-digit', 'Mathematics', 2),
('Geometry - Volume', 'Geometry - Area', 'Mathematics', 1),
('Geometry - Angles', 'Geometry - Shapes', 'Mathematics', 1),
('Geometry - Triangles', 'Geometry - Angles', 'Mathematics', 1),

-- ELA Reading Progressions
('Reading - Phonics', 'Reading - Letter Recognition', 'English Language Arts', 1),
('Reading - Sight Words', 'Reading - Phonics', 'English Language Arts', 1),
('Reading - Fluency', 'Reading - Sight Words', 'English Language Arts', 1),
('Reading - Comprehension', 'Reading - Fluency', 'English Language Arts', 1),
('Reading - Inference', 'Reading - Comprehension', 'English Language Arts', 1),
('Reading - Analysis', 'Reading - Inference', 'English Language Arts', 1),

-- ELA Writing Progressions
('Writing - Letters', 'Writing - Fine Motor', 'English Language Arts', 1),
('Writing - Words', 'Writing - Letters', 'English Language Arts', 1),
('Writing - Sentences', 'Writing - Words', 'English Language Arts', 1),
('Writing - Paragraphs', 'Writing - Sentences', 'English Language Arts', 1),
('Writing - Essays', 'Writing - Paragraphs', 'English Language Arts', 1),
('Writing - Research', 'Writing - Essays', 'English Language Arts', 1),

-- Grammar Progressions
('Grammar - Nouns', 'Reading - Sight Words', 'English Language Arts', 1),
('Grammar - Verbs', 'Grammar - Nouns', 'English Language Arts', 1),
('Grammar - Adjectives', 'Grammar - Nouns', 'English Language Arts', 1),
('Grammar - Sentence Structure', 'Grammar - Verbs', 'English Language Arts', 1),
('Grammar - Punctuation', 'Writing - Sentences', 'English Language Arts', 1),

-- Home Economics Progressions
('Cooking - Knife Skills', 'Cooking - Kitchen Safety', 'Home Economics', 1),
('Cooking - Measuring', 'Cooking - Kitchen Safety', 'Home Economics', 1),
('Cooking - Basic Recipes', 'Cooking - Measuring', 'Home Economics', 1),
('Cooking - Advanced Techniques', 'Cooking - Basic Recipes', 'Home Economics', 1),
('Nutrition - Food Groups', 'Cooking - Kitchen Safety', 'Home Economics', 1),
('Nutrition - Balanced Meals', 'Nutrition - Food Groups', 'Home Economics', 1),
('Budgeting - Basic Math', 'Addition - Multi-digit', 'Home Economics', 2),
('Budgeting - Planning', 'Budgeting - Basic Math', 'Home Economics', 1)
ON CONFLICT (standard_code, prerequisite_code) DO NOTHING;