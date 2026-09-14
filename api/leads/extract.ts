import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const PB_URL = process.env.PRESSBOX_SUPABASE_URL || SUPABASE_URL;
const PB_KEY = process.env.PRESSBOX_SUPABASE_KEY || SUPABASE_ANON_KEY;

// Extract team-like data from HTML text
function extractTeamsFromHTML(html: string, sourceUrl: string): any[] {
  const teams: any[] = [];
  
  // Remove scripts and styles
  const clean = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ');

  // Look for phone numbers (US format)
  const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
  // Look for emails
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  // Look for state abbreviations near team names
  const stateRegex = /\b([A-Z]{2})\b/g;

  // Strategy 1: Look for table rows with team data
  const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  while ((match = tableRowRegex.exec(html)) !== null) {
    const rowHtml = match[1];
    const cells = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    const cellTexts = cells.map(c => c.replace(/<[^>]+>/g, '').trim());
    
    if (cellTexts.length >= 2) {
      // Look for a team name pattern and contact info
      const potentialTeam = cellTexts.find(t => 
        t.length > 2 && t.length < 100 && 
        /team|tigers|eagles|hawks|warriors|bulls|phenoms|elite|academy|baseball|softball|fastpitch/i.test(t)
      );
      const potentialPhone = cellTexts.find(t => phoneRegex.test(t));
      const potentialEmail = cellTexts.find(t => emailRegex.test(t));
      
      if (potentialTeam && (potentialPhone || potentialEmail || cellTexts.length >= 3)) {
        const phoneMatch = potentialPhone?.match(phoneRegex)?.[0] || '';
        const emailMatch = potentialEmail?.match(emailRegex)?.[0] || '';
        
        teams.push({
          team_name: potentialTeam.substring(0, 100),
          phone: phoneMatch,
          email: emailMatch,
          coach_name: cellTexts.find(t => t !== potentialTeam && t !== potentialPhone && t !== potentialEmail && t.length > 2 && t.length < 60) || '',
          source_url: sourceUrl,
          source_type: 'url',
          confidence: 60,
          status: 'new',
        });
      }
    }
  }

  // Strategy 2: Look for div/span patterns with team names
  if (teams.length === 0) {
    // Find all text blocks that look like team names
    const teamNameRegex = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Team|Tigers|Eagles|Hawks|Warriors|Bulls|Phenoms|Elite|Academy|Baseball|Softball|Fastpitch|Storm|Heat|Velocity|Pride|Crush|Riptide|Showcase))/g;
    const seen = new Set<string>();
    let teamMatch;
    while ((teamMatch = teamNameRegex.exec(clean)) !== null) {
      const name = teamMatch[0].trim();
      if (!seen.has(name.toLowerCase()) && name.length > 3) {
        seen.add(name.toLowerCase());
        // Look for nearby phone/email in surrounding text
        const context = clean.substring(Math.max(0, teamMatch.index - 200), Math.min(clean.length, teamMatch.index + 200));
        const phone = context.match(phoneRegex)?.[0] || '';
        const email = context.match(emailRegex)?.[0] || '';
        const state = context.match(/\b(NY|NJ|PA|CT|MA|VA|MD|DE|OH|NC|SC|GA|FL|TX|CA)\b/)?.[0] || '';
        
        teams.push({
          team_name: name,
          phone,
          email,
          state,
          source_url: sourceUrl,
          source_type: 'url',
          confidence: phone || email ? 70 : 40,
          status: 'new',
        });
      }
    }
  }

  // Strategy 3: Find any phone/email pairs in the text
  if (teams.length === 0) {
    const phones = [...clean.matchAll(phoneRegex)].map(m => m[0]);
    const emails = [...clean.matchAll(emailRegex)].map(m => m[0]);
    const seenPhones = new Set<string>();
    
    phones.slice(0, 50).forEach((phone, i) => {
      if (seenPhones.has(phone)) return;
      seenPhones.add(phone);
      const email = emails[i] || '';
      // Look for a name near this phone
      const phoneIdx = clean.indexOf(phone);
      const context = clean.substring(Math.max(0, phoneIdx - 100), Math.min(clean.length, phoneIdx + 100));
      const nameMatch = context.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
      
      teams.push({
        team_name: nameMatch ? nameMatch[0] : `Team ${i + 1}`,
        phone,
        email,
        source_url: sourceUrl,
        source_type: 'url',
        confidence: 50,
        status: 'new',
      });
    });
  }

  // Deduplicate by team name
  const seen = new Set<string>();
  return teams.filter(t => {
    const key = t.team_name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 200); // Cap at 200 leads per source
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  const token = authHeader.substring(7);

  try {
    // Verify auth
    const userResp = await fetch(`${PB_URL}/auth/v1/user`, {
      headers: { apikey: PB_KEY, Authorization: `Bearer ${token}` },
    });
    if (!userResp.ok) return res.status(401).json({ error: 'Invalid token' });
    const user = await userResp.json();

    // Check director is active
    const dirResp = await fetch(`${PB_URL}/rest/v1/pressbox_directors?auth_user_id=eq.${user.id}&select=*`, {
      headers: { apikey: PB_KEY },
    });
    const dirData = await dirResp.json();
    const director = Array.isArray(dirData) && dirData.length > 0 ? dirData[0] : null;
    if (!director || director.status !== 'active') return res.status(403).json({ error: 'Account not active' });

    const { url, pastedText } = req.body;

    let leads: any[] = [];
    let sourceUrl = url || '';
    let sourceType = 'url';

    if (pastedText) {
      // Parse pasted text for team info
      sourceType = 'text';
      const lines = pastedText.split('\n').map((l: string) => l.trim()).filter(Boolean);
      const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

      for (const line of lines) {
        if (line.length < 2 || line.length > 300) continue;
        const phone = line.match(phoneRegex)?.[0] || '';
        const email = line.match(emailRegex)?.[0] || '';
        // Try to extract team name and coach from the line
        const parts = line.split(/[,\t|]/).map((p: string) => p.trim()).filter(Boolean);
        const teamName = parts[0] || line.substring(0, 80);
        const coachName = parts.find((p: string) => /coach|manager|contact/i.test(p)) || parts[1] || '';
        const state = line.match(/\b([A-Z]{2})\b/)?.[1] || '';

        leads.push({
          team_name: teamName,
          coach_name: coachName.replace(/coach:/i, '').trim(),
          phone,
          email,
          state,
          source_url: 'pasted-text',
          source_type: 'text',
          confidence: (phone || email) ? 60 : 40,
          status: 'new',
        });
      }
    } else if (url) {
      // Fetch the URL and extract team data
      sourceType = 'url';
      const fetchResp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });

      if (!fetchResp.ok) {
        return res.status(400).json({ error: `Failed to fetch URL: ${fetchResp.status}` });
      }

      const contentType = fetchResp.headers.get('content-type') || '';
      const html = await fetchResp.text();

      leads = extractTeamsFromHTML(html, url);
    } else {
      return res.status(400).json({ error: 'URL or pasted text is required' });
    }

    if (leads.length === 0) {
      return res.json({ leads: [], message: 'No team data found. Try a different URL or paste the text directly.' });
    }

    // Create a source record
    const sourceResp = await fetch(`${PB_URL}/rest/v1/press_sources`, {
      method: 'POST',
      headers: {
        apikey: PB_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        url: sourceUrl,
        source_type: sourceType,
        status: 'completed',
        leads_found: leads.length,
        created_by: user.id,
      }),
    });
    const sourceData = await sourceResp.json();
    const sourceId = Array.isArray(sourceData) && sourceData.length > 0 ? sourceData[0].id : null;

    // Insert leads into press_leads
    if (sourceId) {
      leads = leads.map(l => ({ ...l, source_id: sourceId }));
    }

    // Batch insert leads
    const leadResp = await fetch(`${PB_URL}/rest/v1/press_leads`, {
      method: 'POST',
      headers: {
        apikey: PB_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(leads),
    });

    if (!leadResp.ok) {
      return res.status(500).json({ error: 'Failed to save leads' });
    }

    const savedLeads = await leadResp.json();
    res.json({ leads: savedLeads, source: sourceData });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
