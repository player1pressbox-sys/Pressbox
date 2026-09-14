// ============================================================
// SUPABASE DATA SERVICE — Direct REST API calls
// Two connections: Player1 (read-only) + Press Box (read/write)
// ============================================================

// Player1 Supabase (read-only — events, teams, registrations)
const P1_URL = "https://kbeahonugmkkbtfndcjq.supabase.co";
const P1_KEY = "sb_publishable_Ofo7dZ2uezBbEmbyMfUehg_d2I2iCsZ";

// Press Box Supabase (read/write — press_teams, directors, leads)
const PB_URL = import.meta.env.VITE_PRESSBOX_SUPABASE_URL || "https://kbeahonugmkkbtfndcjq.supabase.co";
const PB_KEY = import.meta.env.VITE_PRESSBOX_SUPABASE_KEY || P1_KEY;

// Fetch from Player1 (events, teams, registrations)
async function p1Fetch(table: string, params: string = ""): Promise<any[]> {
  try {
    const resp = await fetch(`${P1_URL}/rest/v1/${table}?${params}`, {
      headers: {
        apikey: P1_KEY,
        Authorization: `Bearer ${P1_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!resp.ok) {
      console.error(`Player1 fetch error ${resp.status}: ${table}`);
      return [];
    }
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(`Error fetching Player1 ${table}:`, e);
    return [];
  }
}

// Fetch from Press Box (press_teams, directors, leads)
async function pbFetch(table: string, params: string = ""): Promise<any[]> {
  try {
    const resp = await fetch(`${PB_URL}/rest/v1/${table}?${params}`, {
      headers: {
        apikey: PB_KEY,
        Authorization: `Bearer ${PB_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!resp.ok) {
      console.error(`Press Box fetch error ${resp.status}: ${table}`);
      return [];
    }
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(`Error fetching Press Box ${table}:`, e);
    return [];
  }
}

// Backwards compat alias
const supabaseFetch = pbFetch;

export interface TournamentEvent {
  id: string;
  name: string;
  type: string | null;
  sport: string;
  state: string;
  city: string | null;
  start_date: string;
  end_date: string | null;
  registration_open: boolean;
  price: number | null;
  early_bird_price: number | null;
  early_bird_deadline: string | null;
  insurance_price: number | null;
  owner_id: string;
  director_name: string | null;
  director_website: string | null;
  enabled_divisions: any;
  division_prices: any;
  division_notes: any;
  event_notes: string | null;
  featured: boolean | null;
  approved: boolean | null;
  archived: boolean | null;
  is_demo: boolean | null;
}

export interface TeamRegistration {
  id: string;
  event_id: string;
  team_id: string;
  registered_at: string;
  division: string | null;
  paid: boolean;
  paid_amount: number | null;
  paid_method: string | null;
  paid_at: string | null;
}

export interface PressTeam {
  id: string;
  team_name: string;
  sport: string;
  age_group: string;
  city: string;
  state: string;
  coach_name: string;
  phone: string;
  email: string;
  status: string;
  source: string;
  category: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export async function fetchEvents(): Promise<TournamentEvent[]> {
  return p1Fetch(
    "events",
    "select=id,name,type,sport,state,city,start_date,end_date,registration_open,price,early_bird_price,early_bird_deadline,insurance_price,owner_id,director_name,director_website,enabled_divisions,division_prices,division_notes,event_notes,featured,approved,archived,is_demo&or=(archived.is.null,archived.eq.false)&order=start_date.asc"
  );
}

export async function fetchRegistrations(eventId: string): Promise<TeamRegistration[]> {
  return p1Fetch(
    "registrations",
    `select=id,event_id,team_id,registered_at,division,paid,paid_amount,paid_method,paid_at&event_id=eq.${eventId}&order=registered_at.desc`
  );
}

export async function fetchPressTeams(): Promise<PressTeam[]> {
  return pbFetch(
    "press_teams",
    "select=id,team_name,sport,age_group,city,state,coach_name,phone,email,status,source,category,notes,created_at,updated_at&order=team_name.asc"
  );
}

export async function fetchAllRegistrations(): Promise<TeamRegistration[]> {
  return supabaseFetch(
    "registrations",
    "select=id,event_id,team_id,registered_at,division,paid,paid_amount,paid_method,paid_at&order=registered_at.desc"
  );
}

// Fetch teams from Player1's teams table (separate from press_teams)
export interface Player1Team {
  id: string;
  team_name: string;
  sport: string | null;
  state: string | null;
  city: string | null;
  age_group: string | null;
  owner_id: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  coach_name: string | null;
  team_logo: string | null;
}

export async function fetchPlayer1Teams(): Promise<Player1Team[]> {
  return p1Fetch(
    "teams",
    "select=id,team_name,sport,state,age_group,owner_id,email,first_name,last_name,phone,team_code&order=team_name.asc"
  );
}

// Fetch teams registered for a specific event (joins registrations + teams)
export async function fetchEventTeams(eventId: string): Promise<Array<TeamRegistration & { team_name?: string; sport?: string; state?: string; city?: string; age_group?: string; email?: string; phone?: string; coach_name?: string }>> {
  const [regs, teams] = await Promise.all([
    fetchRegistrations(eventId),
    fetchPlayer1Teams(),
  ]);
  const teamsById = new Map(teams.map(t => [t.id, t]));
  return regs.map(r => {
    const team = teamsById.get(r.team_id);
    return {
      ...r,
      team_name: team?.team_name || "Unknown Team",
      sport: team?.sport || undefined,
      state: team?.state || undefined,
      city: undefined,
      age_group: team?.age_group || undefined,
      email: team?.email || undefined,
      phone: team?.phone || undefined,
      coach_name: team?.coach_name || [team?.first_name, team?.last_name].filter(Boolean).join(" ") || undefined,
    };
  });
}
