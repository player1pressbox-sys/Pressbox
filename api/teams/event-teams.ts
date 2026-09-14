import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
// Player1 Supabase (read-only — events, teams, registrations)
const P1_URL = process.env.PLAYER1_SUPABASE_URL || SUPABASE_URL;
const P1_KEY = process.env.PLAYER1_SUPABASE_KEY || SUPABASE_ANON_KEY;
// Press Box Supabase (read/write — press_teams, directors)
const PB_URL = process.env.PRESSBOX_SUPABASE_URL || SUPABASE_URL;
const PB_KEY = process.env.PRESSBOX_SUPABASE_KEY || SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const eventId = req.query.eventId as string;
    if (!eventId) return res.status(400).json({ error: 'Event ID is required' });

    // Fetch registrations + teams in parallel from Player1
    const [regsResp, teamsResp] = await Promise.all([
      fetch(`${P1_URL}/rest/v1/registrations?event_id=eq.${eventId}&select=id,event_id,team_id,registered_at,division,paid,paid_amount,paid_method,paid_at&order=registered_at.desc`, {
        headers: { apikey: P1_KEY, Authorization: `Bearer ${P1_KEY}` },
      }),
      fetch(`${P1_URL}/rest/v1/teams?select=id,team_name,sport,state,age_group,owner_id,email,first_name,last_name,phone&order=team_name.asc`, {
        headers: { apikey: P1_KEY, Authorization: `Bearer ${P1_KEY}` },
      }),
    ]);

    if (!regsResp.ok || !teamsResp.ok) {
      const regsStatus = regsResp.status;
      const teamsStatus = teamsResp.status;
      const regsBody = await regsResp.text();
      const teamsBody = await teamsResp.text();
      return res.status(500).json({ 
        error: 'Failed to fetch event data',
        debug: { regsStatus, teamsStatus, regsBody: regsBody.substring(0, 500), teamsBody: teamsBody.substring(0, 500) }
      });
    }

    const regs = await regsResp.json();
    const teams = await teamsResp.json();
    const teamsById = new Map((teams || []).map((t: any) => [t.id, t]));

    // Merge registrations with team info
    const eventTeams = (regs || []).map((r: any) => {
      const team = teamsById.get(r.team_id);
      return {
        ...r,
        team_name: team?.team_name || 'Unknown Team',
        sport: team?.sport || null,
        state: team?.state || null,
        city: null,
        age_group: team?.age_group || null,
        email: team?.email || null,
        phone: team?.phone || null,
        coach_name: [team?.first_name, team?.last_name].filter(Boolean).join(' ') || null,
      };
    });

    res.json(eventTeams);
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack?.substring(0, 500) });
  }
}
