import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });

  const token = authHeader.substring(7);

  try {
    // Verify token with Supabase
    const userResp = await fetch(`${PB_URL}/auth/v1/user`, {
      headers: { apikey: PB_KEY, Authorization: `Bearer ${token}` },
    });
    if (!userResp.ok) return res.status(401).json({ error: 'Invalid or expired token' });
    const user = await userResp.json();

    // Get director profile
    const dirResp = await fetch(`${PB_URL}/rest/v1/pressbox_directors?auth_user_id=eq.${user.id}&select=*`, {
      headers: { apikey: PB_KEY },
    });
    const dirData = await dirResp.json();
    const director = Array.isArray(dirData) && dirData.length > 0 ? dirData[0] : null;

    res.json({ user, director });
  } catch (e: any) {
    res.status(401).json({ error: 'Token validation failed' });
  }
}
