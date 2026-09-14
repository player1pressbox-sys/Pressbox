import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const PB_URL = process.env.PRESSBOX_SUPABASE_URL || SUPABASE_URL;
const PB_KEY = process.env.PRESSBOX_SUPABASE_KEY || SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  const token = authHeader.substring(7);

  try {
    const userResp = await fetch(`${PB_URL}/auth/v1/user`, {
      headers: { apikey: PB_KEY, Authorization: `Bearer ${token}` },
    });
    if (!userResp.ok) return res.status(401).json({ error: 'Invalid token' });
    const user = await userResp.json();

    const dirResp = await fetch(`${PB_URL}/rest/v1/pressbox_directors?auth_user_id=eq.${user.id}&select=*`, {
      headers: { apikey: PB_KEY },
    });
    const dirData = await dirResp.json();
    const director = Array.isArray(dirData) && dirData.length > 0 ? dirData[0] : null;
    if (!director || director.status !== 'active') return res.status(403).json({ error: 'Account not active' });

    const { leadId } = req.body;
    if (!leadId) return res.status(400).json({ error: 'Lead ID is required' });

    // Fetch the lead
    const leadResp = await fetch(`${PB_URL}/rest/v1/press_leads?id=eq.${leadId}&select=*`, {
      headers: { apikey: PB_KEY, Authorization: `Bearer ${token}` },
    });
    const leadData = await leadResp.json();
    const lead = Array.isArray(leadData) && leadData.length > 0 ? leadData[0] : null;
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Check if already in press_teams
    const existingResp = await fetch(`${PB_URL}/rest/v1/press_teams?team_name=eq.${encodeURIComponent(lead.team_name)}&select=id`, {
      headers: { apikey: PB_KEY },
    });
    const existing = await existingResp.json();
    if (Array.isArray(existing) && existing.length > 0) {
      // Mark as imported
      await fetch(`${PB_URL}/rest/v1/press_leads?id=eq.${leadId}`, {
        method: 'PATCH',
        headers: { apikey: PB_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'imported', imported_at: new Date().toISOString() }),
      });
      return res.json({ success: true, message: 'Already in Audience Hub' });
    }

    // Insert into press_teams
    const insertResp = await fetch(`${PB_URL}/rest/v1/press_teams`, {
      method: 'POST',
      headers: {
        apikey: PB_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        team_name: lead.team_name,
        sport: lead.sport || 'Baseball',
        age_group: lead.age_group || '',
        city: lead.city || '',
        state: lead.state || '',
        coach_name: lead.coach_name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        status: 'active',
        source: 'lead_finder',
        category: 'prospect',
        notes: `Collected from ${lead.source_url || lead.source_type}. Lead ID: ${lead.id}`,
      }),
    });

    if (!insertResp.ok) {
      return res.status(500).json({ error: 'Failed to add to Audience Hub' });
    }

    // Mark lead as imported
    await fetch(`${PB_URL}/rest/v1/press_leads?id=eq.${leadId}`, {
      method: 'PATCH',
      headers: { apikey: PB_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'imported', imported_at: new Date().toISOString() }),
    });

    const inserted = await insertResp.json();
    res.json({ success: true, team: Array.isArray(inserted) ? inserted[0] : inserted });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
