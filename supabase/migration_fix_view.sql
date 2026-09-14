-- ============================================================
-- Player1 Press Box — Corrected View SQL
-- Run this AFTER the main migration (pressbox_ tables already created)
-- This fixes the view that failed due to wrong table names
-- ============================================================

-- Drop the failed view if it partially created
DROP VIEW IF EXISTS pressbox_audience_contacts;

-- ============================================================
-- VIEW: Press Box Audience Contacts
-- Uses press_teams (your existing marketing contact database)
-- Joins with events and registrations for richer context
-- ============================================================
CREATE OR REPLACE VIEW pressbox_audience_contacts AS
SELECT
  pt.id AS press_team_id,
  pt.team_name,
  pt.sport,
  pt.age_group,
  pt.city,
  pt.state,
  pt.coach_name,
  pt.phone AS coach_phone,
  pt.email AS coach_email,
  pt.instagram,
  pt.facebook,
  pt.status AS team_status,
  pt.source,
  pt.category,
  pt.player1_team_id,
  pt.created_by AS director_id,
  pt.notes,
  pt.created_at,
  pt.updated_at,
  -- Pull in event/registration history
  e.name AS last_event_name,
  e.state AS last_event_state,
  e.city AS last_event_city,
  r.registered_at AS last_registered_at,
  r.division AS last_division,
  r.paid AS last_paid,
  r.paid_amount AS last_paid_amount
FROM press_teams pt
LEFT JOIN registrations r ON r.team_id = pt.player1_team_id
LEFT JOIN events e ON e.id = r.event_id
-- Get the most recent registration per team
WHERE (r.id IS NULL OR r.id = (
  SELECT r2.id FROM registrations r2
  WHERE r2.team_id = pt.player1_team_id
  ORDER BY r2.registered_at DESC
  LIMIT 1
));

-- Grant access to authenticated users (RLS on the view will inherit from press_teams)
GRANT SELECT ON pressbox_audience_contacts TO authenticated;

-- ============================================================
-- VIEW: Press Box Events Summary
-- Summarizes events with registration counts and revenue
-- ============================================================
CREATE OR REPLACE VIEW pressbox_events_summary AS
SELECT
  e.id AS event_id,
  e.name AS event_name,
  e.type,
  e.sport,
  e.state,
  e.city,
  e.start_date,
  e.end_date,
  e.registration_open,
  e.enabled_divisions,
  e.division_prices,
  e.price,
  e.early_bird_price,
  e.early_bird_deadline,
  e.director_name,
  e.owner_id AS director_id,
  e.featured,
  e.approved,
  e.archived,
  e.is_demo,
  -- Registration stats
  COUNT(r.id) AS team_count,
  COUNT(r.id) FILTER (WHERE r.paid = true) AS paid_count,
  COALESCE(SUM(r.paid_amount) FILTER (WHERE r.paid = true), 0) AS total_revenue,
  COALESCE(SUM(r.paid_amount) FILTER (WHERE r.paid = true AND r.insurance_paid = true), 0) AS insurance_revenue,
  COUNT(r.id) FILTER (WHERE r.division IS NOT NULL) AS divisions_filled,
  e.created_at
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id
WHERE e.archived = false OR e.archived IS NULL
GROUP BY e.id, e.name, e.type, e.sport, e.state, e.city, e.start_date, e.end_date,
  e.registration_open, e.enabled_divisions, e.division_prices, e.price, e.early_bird_price,
  e.early_bird_deadline, e.director_name, e.owner_id, e.featured, e.approved, e.archived,
  e.is_demo, e.created_at
ORDER BY e.start_date;

GRANT SELECT ON pressbox_events_summary TO authenticated;

-- ============================================================
-- VIEW: Press Box Division Health
-- Shows fill rate per division per event
-- ============================================================
CREATE OR REPLACE VIEW pressbox_division_health AS
SELECT
  e.id AS event_id,
  e.name AS event_name,
  e.sport,
  e.state,
  e.start_date,
  r.division,
  COUNT(r.id) AS registered_teams,
  e.enabled_divisions->>r.division AS division_capacity,
  CASE 
    WHEN e.enabled_divisions->>r.division IS NOT NULL 
    THEN ROUND(COUNT(r.id)::numeric / (e.enabled_divisions->>r.division)::numeric * 100, 1)
    ELSE NULL 
  END AS fill_rate_pct
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id AND r.division IS NOT NULL
WHERE e.archived = false OR e.archived IS NULL
GROUP BY e.id, e.name, e.sport, e.state, e.start_date, r.division, e.enabled_divisions
ORDER BY e.start_date, r.division;

GRANT SELECT ON pressbox_division_health TO authenticated;

-- ============================================================
-- NOTE: press_posts already exists in your database and handles
-- social media posts. The pressbox_social_posts table from the 
-- migration can be used for scheduled/future posts, while 
-- press_posts handles published posts. Or you can consolidate 
-- by adding the missing columns to press_posts:
-- ============================================================

-- Optionally add scheduling columns to press_posts:
ALTER TABLE press_posts 
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS engagement JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS post_url TEXT;

-- ============================================================
-- RLS on the views (inherits from underlying tables, but 
-- adding explicit policies for clarity)
-- ============================================================
-- The views inherit RLS from press_teams, events, and registrations.
-- Directors will only see data they have access to based on those 
-- tables' existing RLS policies.
