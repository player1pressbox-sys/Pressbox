import type { Express } from "express";
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { ProxyAgent, fetch as undiciFetch } from "undici";

const QUO_API_BASE = "https://api.quo.com/v1";

// Supabase Auth REST config (anon key is public — RLS protects data, not the key)
const SUPABASE_URL = "https://kbeahonugmkkbtfndcjq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Ofo7dZ2uezBbEmbyMfUehg_d2I2iCsZ";

// Quo proxy config
const quoProxyUrl = process.env.CUSTOM_CRED_API_QUO_COM_URL || process.env.HTTPS_PROXY;
const quoAuthToken = process.env.CUSTOM_CRED_API_QUO_COM_TOKEN;

let dispatcher: any;
try {
  if (quoProxyUrl) {
    dispatcher = new ProxyAgent({
      uri: quoProxyUrl,
      requestTls: { rejectUnauthorized: false },
      proxyTls: { rejectUnauthorized: false },
    });
  }
} catch (e: any) {
  console.error("[Quo] ProxyAgent failed:", e.message);
}

async function quoFetch(url: string, options: any = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...options.headers };
  if (quoAuthToken) {
    headers["Authorization"] = quoAuthToken;
  }
  return undiciFetch(url, { ...options, headers, dispatcher });
}

// --- Supabase Auth helpers ---

async function supabaseSignup(email: string, password: string) {
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
    err.status = data.code;
    throw err;
  }
  return data;
}

async function supabaseLogin(email: string, password: string) {
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

async function supabaseGetUser(accessToken: string) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!resp.ok) return null;
  return resp.json();
}

async function supabaseInsertDirector(director: {
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

async function supabaseGetDirectorByUserId(userId: string) {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/pressbox_directors?auth_user_id=eq.${userId}&select=*`,
    { headers: { apikey: SUPABASE_ANON_KEY } }
  );
  if (!resp.ok) return null;
  const data = await resp.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function supabaseCheckAdminExists() {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/pressbox_directors?role=eq.admin&select=id&limit=1`,
    { headers: { apikey: SUPABASE_ANON_KEY } }
  );
  if (!resp.ok) return false;
  const data = await resp.json();
  return Array.isArray(data) && data.length > 0;
}

// --- Auth middleware ---

async function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const token = authHeader.substring(7);
  try {
    const user = await supabaseGetUser(token);
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const director = await supabaseGetDirectorByUserId(user.id);
    req.user = user;
    req.director = director;
    next();
  } catch (e: any) {
    return res.status(401).json({ error: "Token validation failed" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- Auth Routes ---

  // Signup (director)
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name, organizationName, phone } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password, and name are required" });
      }

      // Try to create auth user — if email already exists, try logging in
      let authResult;
      let userId;
      try {
        authResult = await supabaseSignup(email, password);
        userId = authResult.user?.id;
      } catch (signupErr: any) {
        if (signupErr.code === "user_already_exists" || signupErr.message.includes("already registered")) {
          // User exists in Supabase Auth (likely from Player1) — try logging in
          authResult = await supabaseLogin(email, password);
          userId = authResult.user?.id;
        } else {
          throw signupErr;
        }
      }
      if (!userId) {
        return res.status(500).json({ error: "Authentication failed — no user ID returned" });
      }

      // Check if director profile already exists
      const existingDirector = await supabaseGetDirectorByUserId(userId);
      let director;
      if (existingDirector) {
        return res.status(409).json({ error: "Account already exists. Use the login page." });
      } else {
        director = await supabaseInsertDirector({
          auth_user_id: userId,
          email,
          name,
          organization_name: organizationName,
          role: "director",
          status: "pending",
          phone,
        });
      }

      res.json({
        user: authResult.user,
        accessToken: authResult.access_token,
        director,
        message: "Account created. An admin will approve your account.",
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Bootstrap admin (first-run only)
  app.post("/api/auth/bootstrap-admin", async (req, res) => {
    try {
      const { email, password, name, organizationName, phone } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password, and name are required" });
      }

      // Check if admin already exists
      const adminExists = await supabaseCheckAdminExists();
      if (adminExists) {
        return res.status(403).json({ error: "Admin account already exists. Use the login page." });
      }

      // Try to create auth user — if email already exists, try logging in instead
      let authResult;
      let userId;
      try {
        authResult = await supabaseSignup(email, password);
        userId = authResult.user?.id;
      } catch (signupErr: any) {
        if (signupErr.code === "user_already_exists" || signupErr.message.includes("already registered")) {
          // User exists in Supabase Auth (likely from Player1) — try logging in
          authResult = await supabaseLogin(email, password);
          userId = authResult.user?.id;
        } else {
          throw signupErr;
        }
      }
      if (!userId) {
        return res.status(500).json({ error: "Authentication failed — no user ID returned" });
      }

      // Check if director profile already exists for this user
      const existingDirector = await supabaseGetDirectorByUserId(userId);
      let director;
      if (existingDirector) {
        // Director profile exists — can't make them admin through this endpoint
        return res.status(403).json({ error: "This user already has a director profile. Contact support." });
      } else {
        // Insert as admin
        director = await supabaseInsertDirector({
          auth_user_id: userId,
          email,
          name,
          organization_name: organizationName,
          role: "admin",
          status: "active",
          phone,
        });
      }

      res.json({
        user: authResult.user,
        accessToken: authResult.access_token,
        director,
        message: "Admin account created successfully.",
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Check if admin exists (for showing/hiding admin setup page)
  app.get("/api/auth/admin-exists", async (_req, res) => {
    try {
      const exists = await supabaseCheckAdminExists();
      res.json({ adminExists: exists });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const authResult = await supabaseLogin(email, password);
      const userId = authResult.user?.id;
      if (!userId) {
        return res.status(500).json({ error: "Login failed — no user ID returned" });
      }

      const director = await supabaseGetDirectorByUserId(userId);
      if (!director) {
        return res.status(403).json({ error: "No director profile found. Contact an admin." });
      }

      if (director.status === "disabled") {
        return res.status(403).json({ error: "Account disabled. Contact an admin." });
      }

      res.json({
        user: authResult.user,
        accessToken: authResult.access_token,
        director,
      });
    } catch (e: any) {
      res.status(401).json({ error: e.message });
    }
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    res.json({ user: req.user, director: req.director });
  });

  // --- Quo SMS Routes (auth-protected) ---

  // Get Quo phone numbers
  app.get("/api/quo/numbers", requireAuth, async (_req: any, res: any) => {
    try {
      const resp = await quoFetch(`${QUO_API_BASE}/phone-numbers`);
      const data = await resp.json();
      res.json(data);
    } catch (e: any) {
      console.error("[Quo] Error fetching numbers:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Send SMS via Quo
  app.post("/api/quo/send-sms", requireAuth, async (req: any, res: any) => {
    try {
      const { from, to, content } = req.body;
      if (!from || !to || !content) {
        return res.status(400).json({ error: "Missing required fields: from, to, content" });
      }
      const resp = await quoFetch(`${QUO_API_BASE}/messages`, {
        method: "POST",
        body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], content }),
      });
      const data = await resp.json();
      res.status(resp.status).json(data);
    } catch (e: any) {
      console.error("[Quo] Error sending SMS:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Bulk SMS via Quo
  app.post("/api/quo/send-bulk-sms", requireAuth, async (req: any, res: any) => {
    try {
      const { from, recipients, content } = req.body;
      if (!from || !recipients || !Array.isArray(recipients) || !content) {
        return res.status(400).json({ error: "Missing required fields: from, recipients[], content" });
      }
      const results: any[] = [];
      for (const phone of recipients) {
        try {
          const resp = await quoFetch(`${QUO_API_BASE}/messages`, {
            method: "POST",
            body: JSON.stringify({ from, to: [phone], content }),
          });
          const data = await resp.json();
          results.push({ phone, success: resp.status === 202, data });
        } catch (e: any) {
          results.push({ phone, success: false, error: e.message });
        }
      }
      const succeeded = results.filter(r => r.success).length;
      const failed = results.length - succeeded;
      res.json({ total: results.length, succeeded, failed, results });
    } catch (e: any) {
      console.error("[Quo] Error sending bulk SMS:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  return httpServer;
}
