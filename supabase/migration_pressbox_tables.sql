-- ============================================================
-- Player1 Press Box — Supabase Migration
-- Adds pressbox_ tables to the existing Player1 Supabase project
-- These tables REFERENCE Player1's existing data (teams, coaches,
-- tournaments, registrations) without duplicating it.
-- ============================================================

-- ============================================================
-- 1. AUDIENCE SEGMENTS
-- Saved audience filters that directors can reuse
-- ============================================================
CREATE TABLE IF NOT EXISTS pressbox_audience_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID, -- References Player1's organizations table
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}', -- sport, ageGroup, states, distance, status, etc.
  team_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. CAMPAIGNS
-- Marketing campaigns targeting audience segments
-- ============================================================
CREATE TABLE IF NOT EXISTS pressbox_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  tournament_id UUID, -- References Player1's tournaments table
  segment_id UUID REFERENCES pressbox_audience_segments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'email', -- email, sms, social, multi
  template TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sent, active, paused
  subject_line TEXT,
  email_body TEXT,
  sms_body TEXT,
  social_copy TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  audience_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  registration_count INTEGER DEFAULT 0,
  revenue_attributed NUMERIC(10,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_campaigns_director ON pressbox_campaigns(director_id);
CREATE INDEX idx_campaigns_tournament ON pressbox_campaigns(tournament_id);
CREATE INDEX idx_campaigns_status ON pressbox_campaigns(status);

-- ============================================================
-- 3. CAMPAIGN MESSAGES
-- Individual messages sent as part of a campaign or journey
-- ============================================================
CREATE TABLE IF NOT EXISTS pressbox_campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES pressbox_campaigns(id) ON DELETE CASCADE,
  journey_id UUID, -- References pressbox_journeys
  recipient_team_id UUID, -- References Player1's teams table
  recipient_coach_id UUID, -- References Player1's coaches table
  recipient_email TEXT,
  recipient_phone TEXT,
  channel TEXT NOT NULL DEFAULT 'email', -- email, sms, social
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, failed
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_campaign ON pressbox_campaign_messages(campaign_id);
CREATE INDEX idx_messages_recipient ON pressbox_campaign_messages(recipient_team_id);
CREATE INDEX idx_messages_status ON pressbox_campaign_messages(status);

-- ============================================================
-- 4. AUTOMATION JOURNEYS
-- Event-driven campaign sequences
-- ============================================================
CREATE TABLE IF NOT EXISTS pressbox_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- abandoned_registration, past_attendee_return, waitlist_fill, post_event_retention, sponsor_activation
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused
  steps JSONB NOT NULL DEFAULT '[]', -- Array of {name, channel, delay, trigger}
  enrolled_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. JOURNEY ENROLLMENTS
-- Teams currently in an automation journey
-- ============================================================
CREATE TABLE IF NOT EXISTS pressbox_journey_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES pressbox_journeys(id) ON DELETE CASCADE,
  team_id UUID, -- References Player1's teams table
  coach_id UUID, -- References Player1's coaches table
  current_step INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, completed, converted, exited
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_enrollments_journey ON pressbox_journey_enrollments(journey_id);
CREATE INDEX idx_enrollments_team ON pressbox_journey_enrollments(team_id);
CREATE INDEX idx_enrollments_status ON pressbox_journey_enrollments(status);

-- ============================================================
-- 6. CONSENT EVENTS
-- Track marketing consent for every contact
-- ============================================================
CREATE TABLE IF NOT EXISTS pressbox_consent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID, -- References Player1's coaches table
  team_id UUID,
  director_id UUID REFERENCES auth.users(id),
  channel TEXT NOT NULL, -- email, sms, both
  action TEXT NOT NULL, -- opt_in, opt_out, preference_update
  source TEXT, -- registration, manual, import, qr_code
  scope TEXT, -- all_events, specific_tournament, specific_division
  ip_address INET,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_consent_coach ON pressbox_consent_events(coach_id);
CREATE INDEX idx_consent_action ON pressbox_consent_events(action);

-- ============================================================
-- 7. SUPPRESSION LIST
-- Contacts who should never receive marketing
-- ============================================================
CREATE TABLE IF NOT EXISTS pressbox_suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  coach_id UUID,
  reason TEXT NOT NULL, -- opt_out, bounced, complaint, manual
  director_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_suppression_email ON pressbox_suppression_list(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_suppression_phone ON pressbox_suppression_list(phone) WHERE phone IS NOT NULL;

-- ============================================================
-- 8. SOCIAL ACCOUNTS
-- Connected social media accounts for each director/org
-- ============================================================
CREATE TABLE IF NOT EXISTS pressbox_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  platform TEXT NOT NULL, -- facebook, instagram, twitter, tiktok, linkedin
  account_name TEXT NOT NULL,
  account_id TEXT,
  access_token TEXT, -- Encrypted in production via Supabase Vault
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'connected', -- connected, disconnected, expired
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_social_accounts_director ON pressbox_social_accounts(director_id);

-- ============================================================
-- 9. SOCIAL POSTS
-- Scheduled and published social media content
-- ============================================================
CREATE TABLE IF NOT EXISTS pressbox_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  tournament_id UUID, -- References Player1's tournaments
  campaign_id UUID REFERENCES pressbox_campaigns(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  platforms TEXT[] NOT NULL DEFAULT '{}', -- ['facebook', 'instagram', 'twitter']
  media_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, publishing, published, failed
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  post_urls JSONB DEFAULT '{}', -- {platform: url} after publishing
  engagement JSONB DEFAULT '{}', -- {platform: {likes, comments, shares}}
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_social_posts_director ON pressbox_social_posts(director_id);
CREATE INDEX idx_social_posts_scheduled ON pressbox_social_posts(scheduled_for);
CREATE INDEX idx_social_posts_status ON pressbox_social_posts(status);

-- ============================================================
-- 10. SPONSORS
-- Sponsor management and ROI tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS pressbox_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  name TEXT NOT NULL,
  category TEXT,
  tier TEXT DEFAULT 'bronze', -- platinum, gold, silver, bronze
  investment NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, pending_renewal, lapsed
  renewal_date DATE,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. SPONSOR ACTIVATIONS
-- Track sponsor activations at events (QR codes, offers, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS pressbox_sponsor_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID REFERENCES pressbox_sponsors(id) ON DELETE CASCADE,
  tournament_id UUID,
  activation_type TEXT, -- qr_code, offer_code, banner, program_ad, jersey_logo
  qr_code_id TEXT,
  offer_code TEXT,
  scans INTEGER DEFAULT 0,
  redemptions INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  revenue_attributed NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. ATTRIBUTION EVENTS
-- Track which campaigns drove registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS pressbox_attribution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES pressbox_campaigns(id) ON DELETE CASCADE,
  message_id UUID REFERENCES pressbox_campaign_messages(id) ON DELETE CASCADE,
  team_id UUID,
  coach_id UUID,
  tournament_id UUID,
  event_type TEXT NOT NULL, -- registration, revenue, click, open
  value NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attribution_campaign ON pressbox_attribution_events(campaign_id);
CREATE INDEX idx_attribution_tournament ON pressbox_attribution_events(tournament_id);

-- ============================================================
-- 13. CONTENT TEMPLATES
-- Reusable campaign and social media templates
-- ============================================================
CREATE TABLE IF NOT EXISTS pressbox_content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- launch, fill, promotion, retention, recovery, sponsor, social
  channels TEXT[] NOT NULL DEFAULT '{}',
  subject_template TEXT,
  email_template TEXT,
  sms_template TEXT,
  social_template TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- Directors can only see their own data
-- ============================================================

-- Audience Segments
ALTER TABLE pressbox_audience_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Directors see own segments" ON pressbox_audience_segments
  FOR SELECT USING (director_id = auth.uid());
CREATE POLICY "Directors manage own segments" ON pressbox_audience_segments
  FOR ALL USING (director_id = auth.uid());

-- Campaigns
ALTER TABLE pressbox_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Directors see own campaigns" ON pressbox_campaigns
  FOR SELECT USING (director_id = auth.uid());
CREATE POLICY "Directors manage own campaigns" ON pressbox_campaigns
  FOR ALL USING (director_id = auth.uid());

-- Campaign Messages
ALTER TABLE pressbox_campaign_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Directors see own messages" ON pressbox_campaign_messages
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM pressbox_campaigns WHERE director_id = auth.uid())
  );

-- Journeys
ALTER TABLE pressbox_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Directors see own journeys" ON pressbox_journeys
  FOR SELECT USING (director_id = auth.uid());
CREATE POLICY "Directors manage own journeys" ON pressbox_journeys
  FOR ALL USING (director_id = auth.uid());

-- Social Posts
ALTER TABLE pressbox_social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Directors see own social posts" ON pressbox_social_posts
  FOR SELECT USING (director_id = auth.uid());
CREATE POLICY "Directors manage own social posts" ON pressbox_social_posts
  FOR ALL USING (director_id = auth.uid());

-- Sponsors
ALTER TABLE pressbox_sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Directors see own sponsors" ON pressbox_sponsors
  FOR SELECT USING (director_id = auth.uid());
CREATE POLICY "Directors manage own sponsors" ON pressbox_sponsors
  FOR ALL USING (director_id = auth.uid());

-- ============================================================
-- VIEW: Press Box Audience Contacts
-- Joins Player1 teams + coaches into the shape Press Box needs
-- NOTE: Update table/column names to match your actual Player1 schema
-- ============================================================
CREATE OR REPLACE VIEW pressbox_audience_contacts AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.club,
  t.sport,
  t.age_group,
  t.classification,
  t.city,
  t.state,
  t.zip,
  c.id AS coach_id,
  c.name AS coach_name,
  c.email AS coach_email,
  c.phone AS coach_phone,
  c.consent_email,
  c.consent_sms,
  t.last_event,
  t.last_event_date,
  t.total_events,
  t.status AS team_status
FROM teams t
LEFT JOIN coaches c ON c.team_id = t.id;
-- NOTE: This view must be updated to match your actual Player1 table names.
-- Replace 'teams', 'coaches', and column names with your actual schema.

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_audience_segments
  BEFORE UPDATE ON pressbox_audience_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_campaigns
  BEFORE UPDATE ON pressbox_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_journeys
  BEFORE UPDATE ON pressbox_journeys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_social_posts
  BEFORE UPDATE ON pressbox_social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_sponsors
  BEFORE UPDATE ON pressbox_sponsors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_templates
  BEFORE UPDATE ON pressbox_content_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
