import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const QUO_API_KEY = process.env.QUO_API_KEY || '';
const QUO_BASE_URL = 'https://api.quo.com/v1';

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

    const dirResp = await fetch(`${SUPABASE_URL}/rest/v1/pressbox_directors?auth_user_id=eq.${user.id}&select=*`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    const dirData = await dirResp.json();
    const director = Array.isArray(dirData) && dirData.length > 0 ? dirData[0] : null;
    if (!director || director.status !== 'active') return res.status(403).json({ error: 'Account not active' });

    const { content, from, recipients } = req.body;
    if (!content || !from || !recipients || recipients.length === 0) {
      return res.status(400).json({ error: 'Message, from number, and recipients are required' });
    }

    const numbers = Array.isArray(recipients) ? recipients : [recipients];
    const CHUNK_SIZE = 50;
    const results: any[] = [];

    for (let i = 0; i < numbers.length; i += CHUNK_SIZE) {
      const chunk = numbers.slice(i, i + CHUNK_SIZE);
      try {
        const quoResp = await fetch(`${QUO_BASE_URL}/messages`, {
          method: 'POST',
          headers: { Authorization: QUO_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content, from: from, to: chunk }),
        });
        const quoData = await quoResp.json();
        if (!quoResp.ok) throw new Error(quoData.message || 'Quo API error');
        results.push({ chunk: Math.floor(i / CHUNK_SIZE) + 1, success: true, count: chunk.length });
      } catch (e: any) {
        results.push({ chunk: Math.floor(i / CHUNK_SIZE) + 1, success: false, error: e.message });
      }
    }

    const succeeded = results.filter(r => r.success).reduce((sum, r) => sum + (r.count || 0), 0);
    const failed = results.filter(r => !r.success).reduce((sum, r) => sum + (r.count || 0), 0);

    res.json({
      success: failed === 0,
      total: numbers.length,
      succeeded,
      failed,
      results,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
