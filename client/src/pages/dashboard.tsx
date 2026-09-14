import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { fetchEvents, fetchAllRegistrations, fetchPressTeams, type TournamentEvent, type TeamRegistration, type PressTeam } from "@/lib/supabase";
import { campaigns } from "../../../shared/mockData";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  AlertTriangle,
  ArrowRight,
  Mail,
  MessageSquare,
  BarChart3,
  Zap,
  Activity,
  Loader2,
  Calendar,
  MapPin,
} from "lucide-react";

function KpiCard({ icon: Icon, label, value, sublabel, trend, accent }: {
  icon: any; label: string; value: string; sublabel?: string; trend?: number; accent?: boolean;
}) {
  return (
    <Card className={cn("relative overflow-hidden border-card-border", accent && "glow-primary")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>{value}</p>
            {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1.5">
            {trend >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={cn("text-xs font-medium tabular-nums", trend >= 0 ? "text-emerald-500" : "text-red-500")}>
              {trend >= 0 ? "+" : ""}{trend}%
            </span>
            <span className="text-xs text-muted-foreground">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function daysUntil(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const now = new Date();
  const diff = eventDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function Dashboard() {
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [allRegs, setAllRegs] = useState<TeamRegistration[]>([]);
  const [pressTeams, setPressTeams] = useState<PressTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [eventsData, teamsData, regsData] = await Promise.all([
          fetchEvents(),
          fetchPressTeams(),
          fetchAllRegistrations(),
        ]);
        if (!mounted) return;
        setEvents(eventsData);
        setPressTeams(teamsData);
        setAllRegs(regsData);
      } catch (e) {
        console.error("[PressBox] Dashboard load error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Loading your tournament data...</span>
      </div>
    );
  }

  // Calculate real KPIs
  const upcomingEvents = events.filter(e => !e.archived && new Date(e.start_date) >= new Date());
  const paidRegs = allRegs.filter(r => r.paid);
  const totalRevenue = paidRegs.reduce((sum, r) => sum + (r.paid_amount || 0), 0);
  const totalAudience = pressTeams.length;

  const recentCampaigns = campaigns.filter((c) => c.status === "sent" || c.status === "active").slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Next Action Banner */}
      {upcomingEvents.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary glow-primary">
                <Zap className="h-6 w-6" fill="currentColor" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">Recommended Next Action</p>
                <h3 className="mt-0.5 text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  {upcomingEvents.length} upcoming tournament{upcomingEvents.length !== 1 ? 's' : ''} need marketing attention
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {totalAudience > 0
                    ? `You have ${totalAudience} teams in your marketing database. Launch campaigns to fill divisions.`
                    : "Import team contacts to start marketing to eligible teams in your area."}
                </p>
              </div>
            </div>
            <Link href="/campaigns">
              <Button className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90" data-testid="button-launch-action">
                Launch Campaign
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={Calendar}
          label="Upcoming Events"
          value={String(upcomingEvents.length)}
          sublabel={`${events.length} total events`}
          accent
        />
        <KpiCard
          icon={Users}
          label="Registrations"
          value={String(allRegs.length)}
          sublabel={`${paidRegs.length} paid`}
        />
        <KpiCard
          icon={DollarSign}
          label="Revenue"
          value={`$${(totalRevenue / 1000).toFixed(1)}k`}
          sublabel="From paid registrations"
        />
        <KpiCard
          icon={Target}
          label="Marketing DB"
          value={totalAudience.toLocaleString()}
          sublabel={totalAudience > 0 ? `${pressTeams.filter(t => t.email).length} with email` : "Import teams to start"}
        />
      </div>

      {/* Events + Recent Campaigns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Event Cards */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Upcoming Tournaments</h2>
            <span className="text-xs text-muted-foreground">{upcomingEvents.length} events</span>
          </div>
          {upcomingEvents.length === 0 ? (
            <Card className="border-card-border">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">No upcoming tournaments</p>
                <p className="text-xs text-muted-foreground mt-1">Create events in Player1 to see them here</p>
              </CardContent>
            </Card>
          ) : (
            upcomingEvents.slice(0, 8).map((event) => {
              const eventRegs = allRegs.filter(r => r.event_id === event.id);
              const paidCount = eventRegs.filter(r => r.paid).length;
              const revenue = eventRegs.filter(r => r.paid).reduce((s, r) => s + (r.paid_amount || 0), 0);
              const days = daysUntil(event.start_date);
              const divisions = event.enabled_divisions || {};
              const divisionCount = Object.keys(divisions).length;

              return (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card className="cursor-pointer border-card-border transition-all hover:border-primary/30 hover:shadow-md" data-testid={`card-event-${event.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={cn("text-[10px] uppercase", event.sport === 'Baseball' ? "border-blue-500/20 bg-blue-500/10 text-blue-500" : "border-purple-500/20 bg-purple-500/10 text-purple-500")}>
                              {event.sport}
                            </Badge>
                            {event.state && (
                              <>
                                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                  <MapPin className="h-3 w-3" /> {event.city ? `${event.city}, ` : ''}{event.state}
                                </span>
                                <span className="text-xs text-muted-foreground">·</span>
                              </>
                            )}
                            <span className="text-xs text-muted-foreground">{days} days out</span>
                            {event.registration_open && (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 text-[9px]">Registration Open</Badge>
                            )}
                          </div>
                          <h3 className="mt-1.5 text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{event.name}</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {divisionCount > 0 && ` · ${divisionCount} divisions`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>{eventRegs.length}</p>
                          <p className="text-[10px] text-muted-foreground">teams</p>
                        </div>
                      </div>

                      {/* Fill Progress */}
                      <div className="mt-4">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {paidCount} paid / {eventRegs.length} registered
                          </span>
                          <span className="font-medium tabular-nums text-foreground">
                            ${revenue > 0 ? `${(revenue / 1000).toFixed(1)}k` : '—'}
                          </span>
                        </div>
                        <Progress value={eventRegs.length > 0 ? (paidCount / eventRegs.length) * 100 : 0} className="h-2" />
                      </div>

                      {/* Division Chips */}
                      {divisionCount > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {Object.entries(divisions).slice(0, 8).map(([div, cap]) => {
                            const divRegs = eventRegs.filter(r => r.division === div).length;
                            const capNum = typeof cap === 'number' ? cap : parseInt(String(cap)) || 0;
                            const fillPct = capNum > 0 ? (divRegs / capNum) * 100 : 0;
                            const status = fillPct >= 100 ? 'full' : fillPct >= 50 ? 'on_track' : fillPct > 0 ? 'at_risk' : 'empty';
                            return (
                              <Badge key={div} variant="outline" className={cn("text-[10px] font-medium", 
                                status === 'full' ? "bg-primary/15 text-primary" :
                                status === 'on_track' ? "bg-emerald-500/15 text-emerald-500" :
                                status === 'at_risk' ? "bg-amber-500/15 text-amber-500" :
                                "bg-muted text-muted-foreground"
                              )}>
                                {div} · {divRegs}/{capNum || '?'}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      {/* Action needed */}
                      {eventRegs.length === 0 && days <= 30 && days > 0 && (
                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span className="text-xs text-amber-500">No registrations yet — launch marketing campaign</span>
                        </div>
                      )}
                      {eventRegs.length > 0 && paidCount < eventRegs.length && (
                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          <span className="text-xs text-muted-foreground">{eventRegs.length - paidCount} unpaid registrations — send payment reminder</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>

        {/* Recent Campaigns */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Recent Campaigns</h2>
          </div>
          <Card className="border-card-border">
            <CardContent className="space-y-3 p-4">
              {recentCampaigns.map((c) => (
                <div key={c.id} className="rounded-lg border border-card-border p-3" data-testid={`card-campaign-${c.id}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">{c.name}</p>
                    <div className="flex items-center gap-1">
                      {c.type === 'email' && <Mail className="h-3 w-3 text-muted-foreground" />}
                      {c.type === 'sms' && <MessageSquare className="h-3 w-3 text-muted-foreground" />}
                      {c.type === 'social' && <BarChart3 className="h-3 w-3 text-muted-foreground" />}
                      {c.type === 'multi' && <Zap className="h-3 w-3 text-primary" />}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <p className="text-muted-foreground">Open Rate</p>
                      <p className="font-semibold tabular-nums text-foreground">{c.openRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Click Rate</p>
                      <p className="font-semibold tabular-nums text-foreground">{c.clickRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Regist.</p>
                      <p className="font-semibold tabular-nums text-primary">{c.registrations}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Marketing DB Summary */}
          {totalAudience > 0 && (
            <Card className="border-card-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Marketing Database</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total teams</span>
                    <span className="font-semibold tabular-nums text-foreground">{totalAudience.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">With email</span>
                    <span className="font-semibold tabular-nums text-foreground">{pressTeams.filter(t => t.email).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">With phone</span>
                    <span className="font-semibold tabular-nums text-foreground">{pressTeams.filter(t => t.phone).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Total registrations</span>
                    <span className="font-semibold tabular-nums text-foreground">{allRegs.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Paid entries</span>
                    <span className="font-semibold tabular-nums text-emerald-500">{paidRegs.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Baseball</span>
                    <span className="font-semibold tabular-nums text-foreground">{pressTeams.filter(t => t.sport === 'Baseball').length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Fastpitch</span>
                    <span className="font-semibold tabular-nums text-foreground">{pressTeams.filter(t => t.sport === 'Fastpitch').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
