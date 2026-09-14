import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    // Login via Supabase Auth
    const authResp = await fetch(`${PB_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: PB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const authData = await authResp.json();
    if (!authResp.ok) return res.status(401).json({ error: authData.msg || authData.error_description || 'Invalid credentials' });

    const userId = authData.user?.id;
    if (!userId) return res.status(401).json({ error: 'Invalid credentials' });

    // Get director profile
    const dirResp = await fetch(`${PB_URL}/rest/v1/pressbox_directors?auth_user_id=eq.${userId}&select=*`, {
      headers: { apikey: PB_KEY },
    });
    const dirData = await dirResp.json();
    const director = Array.isArray(dirData) && dirData.length > 0 ? dirData[0] : null;

    if (!director) return res.status(403).json({ error: 'No director profile found. Contact an admin.' });

    res.json({ user: authData.user, accessToken: authData.access_token, director });
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
}
