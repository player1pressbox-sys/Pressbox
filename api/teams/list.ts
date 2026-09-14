import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const P1_URL = process.env.PLAYER1_SUPABASE_URL || SUPABASE_URL;
const P1_KEY = process.env.PLAYER1_SUPABASE_KEY || SUPABASE_ANON_KEY;
const PB_URL = process.env.PRESSBOX_SUPABASE_URL || SUPABASE_URL;
const PB_KEY = process.env.PRESSBOX_SUPABASE_KEY || SUPABASE_ANON_KEY;

async function verifyAuth(token: string) {
  const userResp = await fetch(`${PB_URL}/auth/v1/user`, {
    headers: { apikey: PB_KEY, Authorization: `Bearer ${token}` },
  });
  if (!userResp.ok) return null;
  const user = await userResp.json();
  const dirResp = await fetch(`${PB_URL}/rest/v1/pressbox_directors?auth_user_id=eq.${user.id}&select=*`, {
    headers: { apikey: PB_KEY },
  });
  const dirData = await dirResp.json();
  const director = Array.isArray(dirData) && dirData.length > 0 ? dirData[0] : null;
  if (!director || director.status !== 'active') return null;
  return user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  const token = authHeader.substring(7);

  try {
    const user = await verifyAuth(token);
    if (!user) return res.status(401).json({ error: 'Invalid token or inactive account' });

    // GET: list all teams from Player1's teams table
    if (req.method === 'GET') {
      const teamsResp = await fetch(`${P1_URL}/rest/v1/teams?select=id,team_name,sport,state,age_group,owner_id,email,first_name,last_name,phone&order=team_name.asc`, {
        headers: { apikey: P1_KEY, Authorization: `Bearer ${token}` },
      });
      if (!teamsResp.ok) return res.status(500).json({ error: 'Failed to fetch teams' });
      const teams = await teamsResp.json();
      return res.json(teams || []);
    }

    // PATCH: update a press_teams entry in Press Box DB
    if (req.method === 'PATCH') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'Team ID is required' });
      const resp = await fetch(`${PB_URL}/rest/v1/press_teams?id=eq.${id}`, {
        method: 'PATCH',
        headers: { apikey: PB_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
      });
      if (!resp.ok) return res.status(500).json({ error: 'Failed to update team' });
      return res.json({ success: true });
    }

    // DELETE: delete a press_teams entry from Press Box DB
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Team ID is required' });
      const resp = await fetch(`${PB_URL}/rest/v1/press_teams?id=eq.${id}`, {
        method: 'DELETE',
        headers: { apikey: PB_KEY, Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return res.status(500).json({ error: 'Failed to delete team' });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
