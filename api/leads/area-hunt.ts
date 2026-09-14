import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const PB_URL = process.env.PRESSBOX_SUPABASE_URL || SUPABASE_URL;
const PB_KEY = process.env.PRESSBOX_SUPABASE_KEY || SUPABASE_ANON_KEY;

// Extract team names from search snippets
function extractTeamsFromSnippet(title: string, snippet: string, url: string, source: string, state: string): any[] {
  const teams: any[] = [];
  const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

  const combined = `${title} ${snippet}`;
  
  // Common team name patterns
  const teamNamePatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Baseball|Softball|Fastpitch|Heat|Storm|Tigers|Eagles|Hawks|Warriors|Phenoms|Elite|Academy|Velocity|Pride|Crush|Riptide|Showcase|Select|Dirtbags|Bandits|Bombers|Outlaws|Rebels|Warriors|Mustangs|Bulldogs|Wildcats|Cardinals|Giants|Dodgers|Aces|Grays|Bolt|Bolts|Coyotes|Wolverines|Braves|Rangers|Mariners|Angels))/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+\d+[a-zA-Z]{0,2}\s+(?:Baseball|Softball|Fastpitch))/g,
  ];

  const seen = new Set<string>();

  for (const pattern of teamNamePatterns) {
    let match;
    while ((match = pattern.exec(combined)) !== null) {
      const name = match[0].trim();
      if (name.length < 3 || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());

      const idx = combined.indexOf(name);
      const context = combined.substring(Math.max(0, idx - 150), Math.min(combined.length, idx + 150));
      const phone = context.match(phoneRegex)?.[0] || '';
      const email = context.match(emailRegex)?.[0] || '';

      teams.push({
        team_name: name.substring(0, 100),
        phone,
        email,
        state,
        source_url: url,
        source_type: 'area_hunt',
        confidence: phone || email ? 65 : 45,
        status: 'new',
        notes: `Found via ${source}`,
      });
    }
  }

  // Also look for phone/email pairs
  const phones = [...combined.matchAll(phoneRegex)].map(m => m[0]);
  const emails = [...combined.matchAll(emailRegex)].map(m => m[0]);
  phones.slice(0, 3).forEach((phone, i) => {
    const email = emails[i] || '';
    const name = title.substring(0, 80) || `Team ${state}`;
    if (!seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      teams.push({
        team_name: name,
        phone,
        email,
        state,
        source_url: url,
        source_type: 'area_hunt',
        confidence: 55,
        status: 'new',
        notes: `Found via ${source}`,
      });
    }
  });

  return teams;
}

// Parse team names from ranking lists (numbered lists like "1. Team Name")
function extractTeamsFromRankings(text: string, state: string, url: string): any[] {
  const teams: any[] = [];
  const seen = new Set<string>();
  
  // Match patterns like "1. Team Name" or "*Team Name*" or "**Team Name**"
  const rankingRegex = /(?:\d+\.?\s*)?\*{0,2}([A-Z][A-Za-z0-9\s&'-]{2,50})\*{0,2}/g;
  let match;
  while ((match = rankingRegex.exec(text)) !== null) {
    const name = match[1].trim();
    // Filter out non-team words
    if (name.length < 3 || name.length > 50) continue;
    if (/^(Rankings|Divisions?|Age|Season|Team|State|City|Phone|Email|Coach|Notes?|Logo|Location|Head)$|^\d+u?\s*rankings/i.test(name)) continue;
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    
    teams.push({
      team_name: name,
      state,
      source_url: url,
      source_type: 'area_hunt',
      confidence: 40,
      status: 'new',
      notes: `Found via travel baseball rankings for ${state}`,
    });
  }
  
  return teams;
}

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

    const { sport, ageGroup, state, city, radius } = req.body;
    if (!sport || !state) return res.status(400).json({ error: 'Sport and state are required' });

    const sportTerm = sport === 'Fastpitch' ? 'fastpitch+softball' : 'baseball';
    const stateName = state;

    // Create source record
    const sourceResp = await fetch(`${PB_URL}/rest/v1/press_sources`, {
      method: 'POST',
      headers: { apikey: PB_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        url: `area-hunt:${sport}:${ageGroup || 'all'}:${state}:${city || 'all'}`,
        source_type: 'area_hunt',
        search_params: { sport, age_group: ageGroup, state, city, radius },
        status: 'processing',
        created_by: user.id,
      }),
    });
    const sourceData = await sourceResp.json();
    const sourceId = Array.isArray(sourceData) && sourceData.length > 0 ? sourceData[0].id : null;

    // Fetch known team directory pages directly
    const directoryUrls: { url: string; source: string; type: string }[] = [
      { url: `https://selectbaseballteams.com/states/${state.toLowerCase()}/`, source: 'Select Baseball Teams', type: 'directory' },
      { url: `https://www.travelbaseballrankings.com/${stateName.toLowerCase()}.html`, source: 'Travel Baseball Rankings', type: 'rankings' },
      { url: `https://www.fieldlevel.com/app/teams?sportEnum=baseball&athleticAssociation=1024&state=${state.toLowerCase()}`, source: 'FieldLevel', type: 'directory' },
    ];

    // Add city-specific search if provided
    if (city) {
      directoryUrls.push({
        url: `https://www.google.com/search?q=${encodeURIComponent(`${city} ${state} travel ${sport} teams`)}`,
        source: `Google: ${city} ${state}`,
        type: 'search',
      });
    }

    const allLeads: any[] = [];
    const seenNames = new Set<string>();

    // Fetch each directory page
    for (const dir of directoryUrls) {
      try {
        const fetchResp = await fetch(dir.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(12000),
          redirect: 'follow',
        });

        if (!fetchResp.ok) continue;
        const html = await fetchResp.text();
        const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\s+/g, ' ');

        let extracted: any[] = [];
        
        if (dir.type === 'rankings') {
          extracted = extractTeamsFromRankings(text, state, dir.url);
        } else {
          // Extract from title + text
          extracted = extractTeamsFromSnippet(dir.source, text, dir.url, dir.source, state);
          
          // Also try table row extraction
          const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
          let rowMatch;
          while ((rowMatch = tableRowRegex.exec(html)) !== null) {
            const cells = rowMatch[1].match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
            const cellTexts = cells.map(c => c.replace(/<[^>]+>/g, '').trim());
            
            if (cellTexts.length >= 2) {
              const potentialTeam = cellTexts.find(t => 
                t.length > 2 && t.length < 100 && 
                /team|tigers|eagles|hawks|warriors|bulls|phenoms|elite|academy|baseball|softball|fastpitch|storm|heat|velocity|pride|crush|riptide|showcase|select|dirtbags|bandits|bombers|outlaws|rebels|mustangs|bulldogs|wildcats|cardinals|giants|dodgers|aces|grays|bolt|coyotes|wolverines|braves|rangers|mariners|angels/i.test(t)
              );
              if (potentialTeam) {
                const phoneMatch = cellTexts.find(t => /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(t));
                const emailMatch = cellTexts.find(t => /@.*\./.test(t));
                extracted.push({
                  team_name: potentialTeam.substring(0, 100),
                  phone: phoneMatch || '',
                  email: emailMatch || '',
                  state,
                  source_url: dir.url,
                  source_type: 'area_hunt',
                  confidence: phoneMatch || emailMatch ? 70 : 50,
                  status: 'new',
                  notes: `Found via ${dir.source}`,
                });
              }
            }
          }
        }

        for (const lead of extracted) {
          const key = lead.team_name.toLowerCase();
          if (!seenNames.has(key) && lead.team_name.length > 2) {
            seenNames.add(key);
            if (sourceId) lead.source_id = sourceId;
            allLeads.push(lead);
          }
        }
      } catch (e) {
        // Continue with next URL
      }
    }

    // Deduplicate and cap
    const finalLeads = allLeads.slice(0, 200);

    // Save leads to press_leads
    if (finalLeads.length > 0) {
      await fetch(`${PB_URL}/rest/v1/press_leads`, {
        method: 'POST',
        headers: { apikey: PB_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(finalLeads),
      });
    }

    // Update source status
    if (sourceId) {
      await fetch(`${PB_URL}/rest/v1/press_sources?id=eq.${sourceId}`, {
        method: 'PATCH',
        headers: { apikey: PB_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', leads_found: finalLeads.length }),
      });
    }

    res.json({ leads: finalLeads, sources: directoryUrls.map(d => d.source) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
