-- Create storage buckets for files
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('videos', 'videos', true),
  ('screenshots', 'screenshots', true),
  ('generated-videos', 'generated-videos', true);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  csv_file_url TEXT,
  video1_url TEXT,
  video2_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prospects table 
CREATE TABLE public.prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT NOT NULL,
  website_url TEXT NOT NULL,
  screenshot_url TEXT,
  final_video_url TEXT,
  landing_page_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for prospects
CREATE POLICY "Users can view prospects from their projects" 
ON public.prospects 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE public.projects.id = prospects.project_id 
  AND public.projects.user_id = auth.uid()
));

CREATE POLICY "Users can create prospects for their projects" 
ON public.prospects 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE public.projects.id = prospects.project_id 
  AND public.projects.user_id = auth.uid()
));

CREATE POLICY "Users can update prospects from their projects" 
ON public.prospects 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE public.projects.id = prospects.project_id 
  AND public.projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete prospects from their projects" 
ON public.prospects 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.projects 
  WHERE public.projects.id = prospects.project_id 
  AND public.projects.user_id = auth.uid()
));

-- Create storage policies
CREATE POLICY "Users can upload videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read access for videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Users can update their videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Screenshots bucket policies (public)
CREATE POLICY "Public read access for screenshots" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'screenshots');

CREATE POLICY "System can upload screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'screenshots');

CREATE POLICY "System can update screenshots" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'screenshots');

-- Generated videos bucket policies
CREATE POLICY "Public read access for generated videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-videos');

CREATE POLICY "System can upload generated videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'generated-videos');

-- Update timestamp triggers
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prospects_updated_at
BEFORE UPDATE ON public.prospects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();