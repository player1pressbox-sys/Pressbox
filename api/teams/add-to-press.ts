import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const P1_URL = process.env.PLAYER1_SUPABASE_URL || SUPABASE_URL;
const P1_KEY = process.env.PLAYER1_SUPABASE_KEY || SUPABASE_ANON_KEY;
const PB_URL = process.env.PRESSBOX_SUPABASE_URL || SUPABASE_URL;
const PB_KEY = process.env.PRESSBOX_SUPABASE_KEY || SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  const token = authHeader.substring(7);

  try {
    // Verify auth
    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!userResp.ok) return res.status(401).json({ error: 'Invalid token' });
    const user = await userResp.json();

    // Check director is active
    const dirResp = await fetch(`${SUPABASE_URL}/rest/v1/pressbox_directors?auth_user_id=eq.${user.id}&select=*`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    const dirData = await dirResp.json();
    const director = Array.isArray(dirData) && dirData.length > 0 ? dirData[0] : null;
    if (!director || director.status !== 'active') return res.status(403).json({ error: 'Account not active' });

    const { teamId, manual, team_name, sport, age_group, city, state, coach_name, phone, email } = req.body;

    // Manual entry mode — add team directly to press_teams
    if (manual) {
      if (!team_name) return res.status(400).json({ error: 'Team name is required' });

      // Check if already exists
      const existingResp = await fetch(`${PB_URL}/rest/v1/press_teams?team_name=eq.${encodeURIComponent(team_name)}&select=id`, {
        headers: { apikey: PB_KEY },
      });
      const existing = await existingResp.json();
      if (Array.isArray(existing) && existing.length > 0) {
        return res.json({ success: true, message: 'Team already in audience hub', teamId: existing[0].id });
      }

      const insertResp = await fetch(`${PB_URL}/rest/v1/press_teams`, {
        method: 'POST',
        headers: {
          apikey: PB_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          team_name,
          sport: sport || 'Baseball',
          age_group: age_group || '',
          city: city || '',
          state: state || '',
          coach_name: coach_name || '',
          phone: phone || '',
          email: email || '',
          status: 'active',
          source: 'Manual',
          category: 'manual',
          notes: 'Manually added',
        }),
      });

      if (!insertResp.ok) {
        const errText = await insertResp.text();
        return res.status(500).json({ error: `Insert failed: ${errText}` });
      }

      const inserted = await insertResp.json();
      return res.json({ success: true, team: Array.isArray(inserted) ? inserted[0] : inserted });
    }

    if (!teamId) return res.status(400).json({ error: 'Team ID is required' });

    // Fetch the team from Player1's teams table
    const teamResp = await fetch(`${P1_URL}/rest/v1/teams?id=eq.${teamId}&select=*`, {
      headers: { apikey: P1_KEY, Authorization: `Bearer ${token}` },
    });
    if (!teamResp.ok) return res.status(500).json({ error: 'Failed to fetch team' });
    const teamData = await teamResp.json();
    const team = Array.isArray(teamData) && teamData.length > 0 ? teamData[0] : null;
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Check if already exists in press_teams (Press Box DB)
    const existingResp = await fetch(`${PB_URL}/rest/v1/press_teams?team_name=eq.${encodeURIComponent(team.team_name)}&select=id`, {
      headers: { apikey: PB_KEY },
    });
    const existing = await existingResp.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return res.json({ success: true, message: 'Team already in audience hub', teamId: existing[0].id });
    }

    // Insert into press_teams
    const coachName = team.coach_name || [team.first_name, team.last_name].filter(Boolean).join(' ') || '';
    const insertResp = await fetch(`${PB_URL}/rest/v1/press_teams`, {
      method: 'POST',
      headers: {
        apikey: PB_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        team_name: team.team_name,
        sport: team.sport || 'Baseball',
        age_group: team.age_group || '',
        city: team.city || '',
        state: team.state || '',
        coach_name: coachName,
        phone: team.phone || '',
        email: team.email || '',
        status: 'active',
        source: 'Player1',
        category: 'registered',
        notes: `Imported from Player1. Team ID: ${team.id}`,
      }),
    });

    if (!insertResp.ok) {
      const errText = await insertResp.text();
      return res.status(500).json({ error: `Insert failed: ${errText}` });
    }

    const inserted = await insertResp.json();
    res.json({ success: true, team: Array.isArray(inserted) ? inserted[0] : inserted });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
