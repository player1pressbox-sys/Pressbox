-- Run in Supabase SQL Editor
-- Staging tables for the Lead Finder system

-- Sources: tracks where leads came from
CREATE TABLE IF NOT EXISTS press_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT,
  source_type TEXT NOT NULL DEFAULT 'url', -- 'url', 'text', 'area_hunt'
  search_params JSONB, -- sport, age_group, state, city, radius for area hunts
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  leads_found INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

-- Leads: candidate teams collected from external sources
CREATE TABLE IF NOT EXISTS press_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT,
  coach_name TEXT,
  phone TEXT,
  email TEXT,
  sport TEXT,
  age_group TEXT,
  city TEXT,
  state TEXT,
  source_id UUID REFERENCES press_sources(id) ON DELETE SET NULL,
  source_url TEXT,
  source_type TEXT NOT NULL DEFAULT 'url', -- 'url', 'text', 'area_hunt'
  confidence INT DEFAULT 50, -- 0-100, how confident we are this is a real team
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'reviewed', 'imported', 'rejected'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  imported_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS press_leads_status_idx ON press_leads (status);
CREATE INDEX IF NOT EXISTS press_leads_source_idx ON press_leads (source_id);
CREATE INDEX IF NOT EXISTS press_leads_state_idx ON press_leads (state);
CREATE INDEX IF NOT EXISTS press_leads_sport_idx ON press_leads (sport, age_group);

ALTER TABLE press_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE press_leads ENABLE ROW LEVEL SECURITY;

-- Public read (anon key) for leads and sources
DROP POLICY IF EXISTS "Public can read press_sources" ON press_sources;
CREATE POLICY "Public can read press_sources" ON press_sources FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public can read press_leads" ON press_leads;
CREATE POLICY "Public can read press_leads" ON press_leads FOR SELECT TO anon USING (true);

-- Authenticated users can insert/update/delete
DROP POLICY IF EXISTS "Auth can insert press_sources" ON press_sources;
CREATE POLICY "Auth can insert press_sources" ON press_sources FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Auth can update press_sources" ON press_sources;
CREATE POLICY "Auth can update press_sources" ON press_sources FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth can insert press_leads" ON press_leads;
CREATE POLICY "Auth can insert press_leads" ON press_leads FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Auth can update press_leads" ON press_leads;
CREATE POLICY "Auth can update press_leads" ON press_leads FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth can delete press_leads" ON press_leads;
CREATE POLICY "Auth can delete press_leads" ON press_leads FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth can insert press_sources_anon" ON press_sources;
CREATE POLICY "Auth can insert press_sources_anon" ON press_sources FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Auth can insert press_leads_anon" ON press_leads;
CREATE POLICY "Auth can insert press_leads_anon" ON press_leads FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Auth can update press_leads_anon" ON press_leads;
CREATE POLICY "Auth can update press_leads" ON press_leads FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Auth can delete press_leads_anon" ON press_leads;
CREATE POLICY "Auth can delete press_leads" ON press_leads FOR DELETE TO anon USING (true);
