import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const PB_URL = process.env.PRESSBOX_SUPABASE_URL || SUPABASE_URL;
const PB_KEY = process.env.PRESSBOX_SUPABASE_KEY || SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password, name, organizationName, phone } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, and name are required' });

    // Try signup, fall back to login if email exists (shared Player1 users)
    let authResult: any;
    let userId: string;
    try {
      const signupResp = await fetch(`${PB_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { apikey: PB_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      authResult = await signupResp.json();
      if (!signupResp.ok) throw { code: authResult.error_code, message: authResult.msg || authResult.error_description };
      userId = authResult.user?.id;
    } catch (signupErr: any) {
      if (signupErr.code === 'user_already_exists' || (signupErr.message || '').includes('already registered')) {
        // Login instead
        const loginResp = await fetch(`${PB_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { apikey: PB_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        authResult = await loginResp.json();
        if (!loginResp.ok) throw new Error(authResult.msg || 'Login failed');
        userId = authResult.user?.id;
      } else {
        throw signupErr;
      }
    }
    if (!userId) return res.status(500).json({ error: 'Authentication failed' });

    // Check if director profile already exists
    const checkResp = await fetch(`${PB_URL}/rest/v1/pressbox_directors?auth_user_id=eq.${userId}&select=*`, {
      headers: { apikey: PB_KEY },
    });
    const existing = await checkResp.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(409).json({ error: 'Account already exists. Use the login page.' });
    }

    // Insert director profile
    const insertResp = await fetch(`${PB_URL}/rest/v1/pressbox_directors`, {
      method: 'POST',
      headers: { apikey: PB_KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        auth_user_id: userId, email, name,
        organization_name: organizationName, role: 'director', status: 'pending', phone,
      }),
    });
    const director = await insertResp.json();
    if (!insertResp.ok) throw new Error(director.message || 'Failed to create director profile');

    res.json({
      user: authResult.user,
      accessToken: authResult.access_token,
      director: Array.isArray(director) ? director[0] : director,
      message: 'Account created. An admin will approve your account.',
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}
