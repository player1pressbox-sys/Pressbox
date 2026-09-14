import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const PB_URL = process.env.PRESSBOX_SUPABASE_URL || SUPABASE_URL;
const PB_KEY = process.env.PRESSBOX_SUPABASE_KEY || SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  const token = authHeader.substring(7);

  try {
    const userResp = await fetch(`${PB_URL}/auth/v1/user`, {
      headers: { apikey: PB_KEY, Authorization: `Bearer ${token}` },
    });
    if (!userResp.ok) return res.status(401).json({ error: 'Invalid token' });

    // GET: list leads
    if (req.method === 'GET') {
      const status = req.query.status as string || 'new';
      const statusFilter = status === 'all' ? '' : `&status=eq.${status}`;
      const resp = await fetch(
        `${PB_URL}/rest/v1/press_leads?select=id,team_name,coach_name,phone,email,sport,age_group,city,state,source_url,source_type,confidence,status,created_at&order=created_at.desc&limit=200${statusFilter}`,
        { headers: { apikey: PB_KEY, Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) return res.status(500).json({ error: 'Failed to fetch leads' });
      const leads = await resp.json();
      return res.json(leads || []);
    }

    // PATCH: update lead status
    if (req.method === 'PATCH') {
      const { leadId, status } = req.body;
      if (!leadId || !status) return res.status(400).json({ error: 'leadId and status are required' });
      const resp = await fetch(`${PB_URL}/rest/v1/press_leads?id=eq.${leadId}`, {
        method: 'PATCH',
        headers: { apikey: PB_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!resp.ok) return res.status(500).json({ error: 'Failed to update lead' });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
