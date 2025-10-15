-- Create standards library table for pre-seeded state standards
CREATE TABLE IF NOT EXISTS public.standards_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  subject TEXT NOT NULL,
  framework TEXT NOT NULL DEFAULT 'State Standards',
  standards JSONB NOT NULL DEFAULT '[]'::jsonb,
  legal_requirements JSONB DEFAULT '{}'::jsonb,
  source_urls JSONB DEFAULT '[]'::jsonb,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(state, grade_level, subject, framework)
);

-- Enable RLS
ALTER TABLE public.standards_library ENABLE ROW LEVEL SECURITY;

-- Public read access for all authenticated users
CREATE POLICY "Standards library is publicly readable"
  ON public.standards_library
  FOR SELECT
  USING (true);

-- Only admins can insert/update
CREATE POLICY "Admins can manage standards library"
  ON public.standards_library
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_standards_library_lookup 
  ON public.standards_library(state, grade_level, subject);