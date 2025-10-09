-- Phase 1: User Roles System

-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('parent', 'student', 'self_directed_learner', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::app_role
FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Update handle_new_user trigger to use user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  
  -- Insert role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'parent')
  );
  
  RETURN new;
END;
$$;

-- Drop old role column from profiles (keeping table structure minimal)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Update RLS policies to use has_role function

-- Students table policies
DROP POLICY IF EXISTS "Parents can manage their students" ON public.students;
DROP POLICY IF EXISTS "Students can view own profile" ON public.students;

CREATE POLICY "Parents can manage their students"
ON public.students
FOR ALL
USING (
  parent_id = auth.uid() 
  OR public.has_role(auth.uid(), 'self_directed_learner')
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Students can view own profile"
ON public.students
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (
  id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- Courses policies remain largely the same but add admin access
DROP POLICY IF EXISTS "Courses accessible by parent or student" ON public.courses;

CREATE POLICY "Courses accessible by parent or student"
ON public.courses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = courses.student_id
      AND (s.parent_id = auth.uid() OR s.user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Curriculum items policies
DROP POLICY IF EXISTS "Curriculum items accessible by parent or student" ON public.curriculum_items;

CREATE POLICY "Curriculum items accessible by parent or student"
ON public.curriculum_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM courses c
    JOIN students s ON c.student_id = s.id
    WHERE c.id = curriculum_items.course_id
      AND (s.parent_id = auth.uid() OR s.user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Assignments policies
DROP POLICY IF EXISTS "Assignments accessible by parent or student" ON public.assignments;

CREATE POLICY "Assignments accessible by parent or student"
ON public.assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM curriculum_items ci
    JOIN courses c ON ci.course_id = c.id
    JOIN students s ON c.student_id = s.id
    WHERE assignments.curriculum_item_id = ci.id
      AND (s.parent_id = auth.uid() OR s.user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Add index for performance on user_roles lookups
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);