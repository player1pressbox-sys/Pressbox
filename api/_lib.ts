// Shared utilities for Vercel serverless functions
// Uses environment variables set in Vercel project settings

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const QUO_API_KEY = process.env.QUO_API_KEY || "";

// Quo API base URL
const QUO_BASE_URL = "https://api.quo.com/v1";

// Helper: verify Supabase auth token and get user + director profile
export async function verifyAuth(req: any): Promise<{ user: any; director: any } | null> {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  
  const token = authHeader.substring(7);
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!resp.ok) return null;
  const user = await resp.json();
  
  // Get director profile
  const dirResp = await fetch(
    `${SUPABASE_URL}/rest/v1/pressbox_directors?auth_user_id=eq.${user.id}&select=*`,
    { headers: { apikey: SUPABASE_ANON_KEY } }
  );
  const dirData = await dirResp.json();
  const director = Array.isArray(dirData) && dirData.length > 0 ? dirData[0] : null;
  
  return { user, director };
}

// Helper: require active admin or director
export function requireActiveDirector(auth: { user: any; director: any } | null): { error: boolean; message?: string } {
  if (!auth) return { error: true, message: "Not authenticated" };
  if (!auth.director) return { error: true, message: "No director profile found" };
  if (auth.director.status !== "active") return { error: true, message: "Account pending approval" };
  return { error: false };
}

// Helper: Supabase Auth signup
export async function supabaseSignup(email: string, password: string) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    const errMsg = data.msg || data.error_description || data.message || data.error_code || "Signup failed";
    const err: any = new Error(errMsg);
    err.code = data.error_code;
    throw err;
  }
  return data;
}

// Helper: Supabase Auth login
export async function supabaseLogin(email: string, password: string) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.msg || data.error_description || data.message || data.error_code || "Login failed");
  return data;
}

// Helper: Insert director profile
export async function supabaseInsertDirector(director: {
  auth_user_id: string;
  email: string;
  name: string;
  organization_name?: string;
  role: string;
  status: string;
  phone?: string;
}) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/pressbox_directors`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(director),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.message || "Failed to create director profile");
  return Array.isArray(data) ? data[0] : data;
}

// Helper: Get director by auth user ID
export async function supabaseGetDirectorByUserId(userId: string) {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/pressbox_directors?auth_user_id=eq.${userId}&select=*`,
    { headers: { apikey: SUPABASE_ANON_KEY } }
  );
  const data = await resp.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

// Helper: Check if admin exists
export async function supabaseCheckAdminExists(): Promise<boolean> {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/pressbox_directors?role=eq.admin&select=id&limit=1`,
    { headers: { apikey: SUPABASE_ANON_KEY } }
  );
  const data = await resp.json();
  return Array.isArray(data) && data.length > 0;
}

// Helper: Quo API fetch with raw API key (no proxy needed on Vercel)
export async function quoFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = endpoint.startsWith("http") ? endpoint : `${QUO_BASE_URL}${endpoint}`;
  const resp = await fetch(url, {
    ...options,
    headers: {
      Authorization: QUO_API_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Quo API error: ${data.message || data.error || resp.status}`);
  }
  return data;
}
