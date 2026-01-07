-- Create the career_applications table
CREATE TABLE IF NOT EXISTS career_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Personal Information
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    contact TEXT NOT NULL, -- Telegram or other contact
    
    -- Professional Info
    position TEXT NOT NULL,
    experience TEXT NOT NULL, -- Junior, Middle, Senior
    tools TEXT[] DEFAULT '{}', -- Array of tool names (FlutterFlow, Supabase, etc.)
    why_us TEXT,
    
    -- Test & Assessment
    test_answers JSONB DEFAULT '{}', -- Store full questions and selected answers
    test_score INTEGER DEFAULT 0,
    
    -- Practical Task
    task_file_url TEXT, -- URL to the uploaded file (optional)
    
    -- Status Management
    status TEXT DEFAULT 'new_candidate' CHECK (status IN ('new_candidate', 'test_passed', 'task_submitted', 'approved', 'rejected')),
    
    -- File storage (if separate from task_file_url, e.g. Resume)
    cv_url TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE career_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users (candidates) to INSERT applications
CREATE POLICY "Allow public insert" 
ON career_applications 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Policy: Allow admins to VIEW all applications
-- Assuming admins are authenticated users. Modify if you have a specific 'admin' role or check.
CREATE POLICY "Allow authenticated view" 
ON career_applications 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Allow admins to UPDATE applications (e.g. change status)
CREATE POLICY "Allow authenticated update" 
ON career_applications 
FOR UPDATE 
TO authenticated 
USING (true);

-- Create Storage Bucket for Career Uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('career-uploads', 'career-uploads', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow public to upload files
CREATE POLICY "Allow public upload" 
ON storage.objects 
FOR INSERT 
TO anon 
WITH CHECK (bucket_id = 'career-uploads');

-- Storage Policy: Allow public to read their own files (or all public files if easier for now)
CREATE POLICY "Allow public read" 
ON storage.objects 
FOR SELECT 
TO anon 
USING (bucket_id = 'career-uploads');
