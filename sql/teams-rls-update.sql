-- Run in Supabase SQL Editor
-- Allow authenticated directors to update and delete press_teams

-- Allow UPDATE for authenticated users
DROP POLICY IF EXISTS "Directors can update press_teams" ON press_teams;
CREATE POLICY "Directors can update press_teams"
  ON press_teams FOR UPDATE
  TO authenticated
  USING (true);

-- Allow DELETE for authenticated users
DROP POLICY IF EXISTS "Directors can delete press_teams" ON press_teams;
CREATE POLICY "Directors can delete press_teams"
  ON press_teams FOR DELETE
  TO authenticated
  USING (true);
