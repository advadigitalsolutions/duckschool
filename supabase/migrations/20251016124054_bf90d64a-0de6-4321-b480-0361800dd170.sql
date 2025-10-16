-- Create parent_todo_items table
CREATE TABLE public.parent_todo_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.parent_todo_items ENABLE ROW LEVEL SECURITY;

-- Create policies for parent access
CREATE POLICY "Parents can view own todo items"
ON public.parent_todo_items
FOR SELECT
TO authenticated
USING (parent_id = auth.uid());

CREATE POLICY "Parents can create own todo items"
ON public.parent_todo_items
FOR INSERT
TO authenticated
WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own todo items"
ON public.parent_todo_items
FOR UPDATE
TO authenticated
USING (parent_id = auth.uid());

CREATE POLICY "Parents can delete own todo items"
ON public.parent_todo_items
FOR DELETE
TO authenticated
USING (parent_id = auth.uid());

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_parent_todo_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_parent_todo_items_updated_at
BEFORE UPDATE ON public.parent_todo_items
FOR EACH ROW
EXECUTE FUNCTION public.update_parent_todo_updated_at();