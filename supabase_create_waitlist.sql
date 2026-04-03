-- Create Waitlist Table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  lang TEXT DEFAULT 'FR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous inserts
CREATE POLICY "Allow public inserts" ON public.waitlist
FOR INSERT WITH CHECK (true);

-- Allow authenticated admins to view all (using service_role if needed or a role)
-- For now, let's allow all authenticated users (admins in the CMS are authenticated)
CREATE POLICY "Allow authenticated selects" ON public.waitlist
FOR SELECT USING (auth.role() = 'authenticated');
