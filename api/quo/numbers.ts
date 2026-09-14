import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const PB_URL = process.env.PRESSBOX_SUPABASE_URL || SUPABASE_URL;
const PB_KEY = process.env.PRESSBOX_SUPABASE_KEY || SUPABASE_ANON_KEY;
const QUO_API_KEY = process.env.QUO_API_KEY || '';
const QUO_BASE_URL = 'https://api.quo.com/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Verify auth
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

    // Fetch Quo phone numbers (correct endpoint: /phone-numbers with hyphen)
    const quoResp = await fetch(`${QUO_BASE_URL}/phone-numbers`, {
      headers: { Authorization: QUO_API_KEY },
    });
    const quoData = await quoResp.json();
    if (!quoResp.ok) return res.status(500).json({ error: quoData.message || 'Quo API error' });

    const numbers = (quoData.data || quoData.phone_numbers || quoData || []).map((n: any) => ({
      id: n.id,
      number: n.number || n.phone_number,
      label: n.name || n.label || n.formattedNumber || n.number || n.phone_number,
    }));
    res.json(numbers);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
