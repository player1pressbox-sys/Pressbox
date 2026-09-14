-- Create admin profile for existing Player1 user
-- Run this in the Supabase SQL Editor
-- This maps your existing Player1 auth user to a Press Box admin

INSERT INTO pressbox_directors (auth_user_id, email, name, role, status, organization_name)
SELECT id, email, 'Press Box Admin', 'admin', 'active', 'Player1 Elite'
FROM auth.users
WHERE email = 'evolveanddevelope@gmail.com'
ON CONFLICT (auth_user_id) DO NOTHING;

-- Verify it worked
SELECT * FROM pressbox_directors WHERE role = 'admin';
