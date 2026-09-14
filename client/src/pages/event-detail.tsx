import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { fetchEvents, fetchRegistrations, fetchPressTeams, type TournamentEvent, type TeamRegistration, type PressTeam } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Zap,
  Target,
  Mail,
  MessageSquare,
  Share2,
  Trophy,
  Loader2,
} from "lucide-react";

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function EventDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [event, setEvent] = useState<TournamentEvent | null>(null);
  const [registrations, setRegistrations] = useState<TeamRegistration[]>([]);
  const [eventTeams, setEventTeams] = useState<any[]>([]);
  const [pressTeams, setPressTeams] = useState<PressTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTeam, setAddingTeam] = useState<string | null>(null);
  const [addingAll, setAddingAll] = useState(false);
  const [addedTeams, setAddedTeams] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [eventsData, pressTeamsData] = await Promise.all([
          fetchEvents(),
          fetchPressTeams(),
        ]);
        if (!mounted) return;
        const found = eventsData.find((e) => e.id === id);
        if (!found) {
          setLoading(false);
          return;
        }
        setEvent(found);
        setPressTeams(pressTeamsData);
        // Fetch registrations + team names via API (works without auth — public data)
        const teamsResp = await fetch(`/api/teams/event-teams?eventId=${found.id}`);
        if (teamsResp.ok) {
          const teams = await teamsResp.json();
          if (mounted) {
            setEventTeams(teams);
            setRegistrations(teams);
          }
        } else {
          // Fallback: fetch just registrations (no team names)
          const regs = await fetchRegistrations(found.id);
          if (mounted) setRegistrations(regs);
        }
      } catch (e) {
        console.error("[PressBox] Event detail load error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Loading tournament details...</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Trophy className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Tournament not found.</p>
        <Link href="/">
          <Button variant="link" className="mt-2">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const paidRegs = registrations.filter((r) => r.paid);
  const revenue = paidRegs.reduce((s, r) => s + (r.paid_amount || 0), 0);
  const lapsedTeams = pressTeams.filter((t) => t.status === "lapsed").length;
  const price = event.price || 0;
  const capacity = 50;
  const fillRate = Math.round((registrations.length / capacity) * 100);

  // Check which teams are already in press_teams
  const pressTeamNames = new Set(pressTeams.map(t => t.team_name.toLowerCase()));

  const handleAddToPress = async (teamId: string, teamName: string) => {
    if (!token) return;
    setAddingTeam(teamId);
    try {
      const resp = await fetch('/api/teams/add-to-press', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ teamId }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to add team');
      setAddedTeams(prev => new Set([...prev, teamId]));
    } catch (e: any) {
      alert('Failed to add team: ' + e.message);
    } finally {
      setAddingTeam(null);
    }
  };

  const notInPressCount = registrations.filter((r: any) => {
    const teamName = (r.team_name || '').toLowerCase();
    const teamId = r.team_id;
    return teamId && !pressTeamNames.has(teamName) && !addedTeams.has(teamId);
  }).length;

  const handleAddAllToPress = async () => {
    if (!token) return;
    const toAdd = registrations.filter((r: any) => {
      const teamName = (r.team_name || '').toLowerCase();
      const teamId = r.team_id;
      return teamId && !pressTeamNames.has(teamName) && !addedTeams.has(teamId);
    });
    if (toAdd.length === 0) return;
    setAddingAll(true);
    const newAdded = new Set(addedTeams);
    for (const r of toAdd) {
      try {
        const resp = await fetch('/api/teams/add-to-press', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ teamId: r.team_id }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error);
        newAdded.add(r.team_id);
        setAddedTeams(new Set(newAdded));
      } catch (e) {
        // continue with next team
      }
    }
    setAddingAll(false);
  };

  // Parse divisions from enabled_divisions
  const divisions = event.enabled_divisions
    ? Object.entries(event.enabled_divisions).map(([name, enabled]) => {
        const divRegs = registrations.filter((r) => r.division === name);
        return {
          name,
          sport: event.sport,
          registered: divRegs.length,
          capacity: 12,
          paid: divRegs.filter((r) => r.paid).length,
        };
      }).filter((d) => d.registered > 0 || true)
    : [];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/">
        <Button variant="ghost" size="sm" className="text-muted-foreground" data-testid="button-back-dashboard">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Dashboard
        </Button>
      </Link>

      {/* Event Header */}
      <Card className="border-card-border">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[10px] uppercase", event.sport === "Baseball" ? "border-blue-500/20 bg-blue-500/10 text-blue-500" : "border-purple-500/20 bg-purple-500/10 text-purple-500")}>
                  {event.sport}
                </Badge>
                <Badge variant="outline" className={cn("text-[10px] uppercase", event.registration_open ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-muted-foreground/20 bg-muted text-muted-foreground")}>
                  {event.registration_open ? "Registration Open" : "Closed"}
                </Badge>
              </div>
              <h1 className="mt-2 text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{event.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.city ? `${event.city}, ` : ""}{event.state || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(event.start_date)}{event.end_date ? ` → ${formatDate(event.end_date)}` : ""}
                </span>
                {event.director_name && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />Director: {event.director_name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" data-testid="button-share-event">
                <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
              </Button>
              <Link href="/campaigns">
                <Button size="sm" className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90" data-testid="button-launch-campaign-event">
                  <Zap className="mr-1.5 h-3.5 w-3.5" /> Launch Campaign
                </Button>
              </Link>
            </div>
          </div>

          {/* KPI Row */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-card-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="h-3.5 w-3.5" /> Fill Rate
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>{Math.min(fillRate, 100)}%</p>
              <p className="text-[10px] text-muted-foreground">{registrations.length} / {capacity} teams</p>
            </div>
            <div className="rounded-lg border border-card-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5" /> Revenue
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {revenue > 0 ? `$${(revenue / 1000).toFixed(1)}k` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">{price > 0 ? `$${price} entry fee` : "No fee set"}</p>
            </div>
            <div className="rounded-lg border border-card-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Paid
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-500" style={{ fontFamily: "var(--font-display)" }}>{paidRegs.length}</p>
              <p className="text-[10px] text-muted-foreground">of {registrations.length} registered</p>
            </div>
            <div className="rounded-lg border border-card-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> Lapsed Teams
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-500" style={{ fontFamily: "var(--font-display)" }}>{lapsedTeams}</p>
              <p className="text-[10px] text-muted-foreground">in your database</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Divisions + Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Division Table */}
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Division Health</h2>
          {divisions.length === 0 ? (
            <Card className="border-card-border">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No division data available for this event.</p>
              </CardContent>
            </Card>
          ) : (
            divisions.map((d) => {
              const divFill = Math.round((d.registered / d.capacity) * 100);
              return (
                <Card key={d.name} className="border-card-border" data-testid={`card-division-detail-${d.name}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">{d.name}</h3>
                          <Badge variant="outline" className={cn("text-[10px]", divFill >= 80 ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : divFill >= 50 ? "border-amber-500/20 bg-amber-500/10 text-amber-500" : "border-muted-foreground/20 bg-muted text-muted-foreground")}>
                            {d.registered}/{d.capacity}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{d.sport}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>{Math.min(divFill, 100)}%</p>
                        <p className="text-[10px] text-muted-foreground">{d.registered}/{d.capacity} filled</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={Math.min(divFill, 100)} className="h-1.5" />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                      <div>
                        <p className="text-muted-foreground">Registered</p>
                        <p className="font-bold tabular-nums text-foreground">{d.registered}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Paid</p>
                        <p className="font-bold tabular-nums text-emerald-500">{d.paid}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className="font-bold tabular-nums text-amber-500">{Math.max(0, d.capacity - d.registered)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Quick Actions</h2>
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">Event Summary</p>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Registrations</span>
                  <span className="font-bold tabular-nums text-foreground">{registrations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid Registrations</span>
                  <span className="font-bold tabular-nums text-emerald-500">{paidRegs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unpaid</span>
                  <span className="font-bold tabular-nums text-amber-500">{registrations.length - paidRegs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-bold tabular-nums text-foreground">{revenue > 0 ? `$${revenue.toLocaleString()}` : "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/campaigns">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" data-testid="button-action-abandoned">
                  <Mail className="mr-2 h-3.5 w-3.5" /> Recover abandoned registrations
                </Button>
              </Link>
              <Link href="/campaigns">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" data-testid="button-action-lapsed">
                  <Users className="mr-2 h-3.5 w-3.5" /> Reactivate {lapsedTeams} lapsed teams
                </Button>
              </Link>
              <Link href="/campaigns">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" data-testid="button-action-sms">
                  <MessageSquare className="mr-2 h-3.5 w-3.5" /> SMS blast to nearby coaches
                </Button>
              </Link>
              <Link href="/social">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" data-testid="button-action-social">
                  <Share2 className="mr-2 h-3.5 w-3.5" /> Post social announcement
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Registered Teams */}
      {registrations.length > 0 && (
        <Card className="border-card-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Registered Teams ({registrations.length})</CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {notInPressCount > 0 && (
                  <Button
                    size="sm"
                    onClick={handleAddAllToPress}
                    disabled={addingAll}
                    className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90 h-7 text-xs"
                  >
                    {addingAll ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Adding {notInPressCount}...</> : <>+ Add All ({notInPressCount})</>}
                  </Button>
                )}
                <span className="font-semibold text-emerald-500">{paidRegs.length} paid</span>
                <span>·</span>
                <span className="font-semibold text-amber-500">{registrations.length - paidRegs.length} unpaid</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Team</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Division</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Registered</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payment</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Audience Hub</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r: any) => {
                    const teamName = r.team_name || "Unknown Team";
                    const coachName = r.coach_name || "—";
                    const teamId = r.team_id;
                    const isInPress = pressTeamNames.has(teamName.toLowerCase()) || addedTeams.has(teamId);
                    return (
                      <tr key={r.id} className="border-b border-card-border/50 transition-colors hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-foreground">{teamName}</p>
                          <p className="text-[10px] text-muted-foreground">{coachName}</p>
                        </td>
                        <td className="px-4 py-3">
                          {r.division ? <Badge variant="outline" className="text-[10px]">{r.division}</Badge> : <span className="text-[10px] text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">{r.city ? `${r.city}, ` : ""}{r.state || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] text-muted-foreground">{r.registered_at ? new Date(r.registered_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          {r.paid ? (
                            <Badge variant="outline" className="text-[10px] border-emerald-500/20 bg-emerald-500/10 text-emerald-500">Paid {r.paid_amount ? `$${r.paid_amount}` : ""}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-amber-500/20 bg-amber-500/10 text-amber-500">Unpaid</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isInPress ? (
                            <span className="text-[10px] font-medium text-emerald-500">✓ In Hub</span>
                          ) : teamId ? (
                            <button
                              onClick={() => handleAddToPress(teamId, teamName)}
                              disabled={addingTeam === teamId}
                              className="text-[10px] font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                            >
                              {addingTeam === teamId ? "Adding..." : "+ Add to Hub"}
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
