import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { fetchEvents, fetchPressTeams, type TournamentEvent, type PressTeam } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { campaigns, campaignTemplates } from "../../../shared/mockData";
import {
  Mail,
  MessageSquare,
  Share2,
  Zap,
  Plus,
  Send,
  Eye,
  MousePointerClick,
  Users,
  DollarSign,
  Sparkles,
  Copy,
  Check,
  Phone,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";

const API_BASE = typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "";

interface QuoPhoneNumber {
  id: string;
  name: string;
  number: string;
  label?: string;
}

const typeIcons: Record<string, any> = {
  email: Mail,
  sms: MessageSquare,
  social: Share2,
  multi: Zap,
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/15 text-blue-500",
  sent: "bg-emerald-500/15 text-emerald-500",
  active: "bg-primary/15 text-primary",
};

export default function CampaignStudio() {
  const { token } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("campaigns");
  const [campaignList, setCampaignList] = useState<typeof campaigns>([]);
  const [tournaments, setTournaments] = useState<TournamentEvent[]>([]);

  // SMS Blast state
  const [quoNumbers, setQuoNumbers] = useState<QuoPhoneNumber[]>([]);
  const [selectedFrom, setSelectedFrom] = useState<string>("");
  const [teams, setTeams] = useState<PressTeam[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [smsContent, setSmsContent] = useState("");
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsResult, setSmsResult] = useState<any>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [numbersLoading, setNumbersLoading] = useState(true);
  const [teamSearch, setTeamSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  // Load Quo phone numbers and teams
  useEffect(() => {
    if (!token) return; // Wait for auth token before fetching
    async function load() {
      try {
        setNumbersLoading(true);
        const [numsResp, teamsData, eventsData] = await Promise.all([
          fetch(`${API_BASE}/api/quo/numbers`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetchPressTeams(),
          fetchEvents(),
        ]);
        const numsJson = await numsResp.json();
        const nums = Array.isArray(numsJson) ? numsJson : (numsJson.data || []);
        const mapped = nums.map((n: any) => ({
          id: n.id,
          number: n.number,
          name: n.name || n.label || n.number,
          label: n.label,
        }));
        if (mapped.length > 0) {
          setQuoNumbers(mapped);
          setSelectedFrom(mapped[0].number);
        } else if (numsJson.error) {
          setSmsError(numsJson.error);
        }
        setTeams(teamsData.filter(t => t.phone));
        setTournaments(eventsData);
        setNumbersLoading(false);
      } catch (e) {
        setSmsError("Failed to load data. Check your connection.");
        setNumbersLoading(false);
      }
    }
    load();
  }, [token]);

  const filteredTeams = teams.filter(t => {
    if (sportFilter && t.sport !== sportFilter) return false;
    if (stateFilter && t.state !== stateFilter) return false;
    if (teamSearch) {
      const q = teamSearch.toLowerCase();
      return t.team_name.toLowerCase().includes(q) || t.coach_name.toLowerCase().includes(q) || t.phone.includes(q);
    }
    return true;
  });

  const toggleTeam = (id: string) => {
    setSelectedTeamIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedTeamIds(new Set(filteredTeams.map(t => t.id)));
  };

  const clearSelection = () => setSelectedTeamIds(new Set());

  const selectedTeams = teams.filter(t => selectedTeamIds.has(t.id));
  const selectedPhones = selectedTeams.map(t => {
    let p = t.phone.replace(/[^0-9+]/g, "");
    if (!p.startsWith("+")) p = "+1" + p;
    return p;
  });

  const handleSendSms = async () => {
    if (!selectedFrom || selectedPhones.length === 0 || !smsContent) return;
    setSmsLoading(true);
    setSmsError(null);
    setSmsResult(null);
    try {
      const resp = await fetch(`${API_BASE}/api/quo/send-bulk-sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          from: selectedFrom,
          recipients: selectedPhones,
          content: smsContent,
          phoneNumberId: quoNumbers.find(n => n.number === selectedFrom)?.id,
        }),
      });
      const data = await resp.json();
      setSmsResult(data);
    } catch (e: any) {
      setSmsError(e.message || "Failed to send SMS");
    } finally {
      setSmsLoading(false);
    }
  };

  const charCount = smsContent.length;
  const segments = Math.ceil(charCount / 160);

  const template = campaignTemplates.find((t) => t.id === selectedTemplate);
  const handleGenerate = () => setGenerated(true);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  const handleDeleteCampaign = (id: string) => {
    setCampaignList(prev => prev.filter(c => c.id !== id));
  };

  const states = [...new Set(teams.map(t => t.state).filter(Boolean))].sort();
  const sports = [...new Set(teams.map(t => t.sport).filter(Boolean))].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Campaign Studio</h2>
          <p className="mt-1 text-sm text-muted-foreground">Create, schedule, and track marketing campaigns across email, SMS, and social</p>
        </div>
        <Button onClick={() => setActiveTab("studio")} className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90" data-testid="button-new-campaign-studio">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New Campaign
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="campaigns" className="text-xs whitespace-nowrap">Campaign History</TabsTrigger>
          <TabsTrigger value="studio" className="text-xs whitespace-nowrap">Campaign Builder</TabsTrigger>
          <TabsTrigger value="sms" className="text-xs whitespace-nowrap">SMS Blast (Quo)</TabsTrigger>
        </TabsList>

        {/* Campaign History */}
        <TabsContent value="campaigns" className="space-y-4">
          {campaignList.length === 0 ? (
            <Card className="border-card-border">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Mail className="mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No campaigns yet. Click "New Campaign" to create your first one.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card className="border-card-border"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" /> Avg Open Rate</div><p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>—</p></CardContent></Card>
                <Card className="border-card-border"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><MousePointerClick className="h-3.5 w-3.5" /> Avg Click Rate</div><p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>—</p></CardContent></Card>
                <Card className="border-card-border"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> Total Registrations</div><p className="mt-1 text-2xl font-bold tabular-nums text-primary" style={{ fontFamily: "var(--font-display)" }}>—</p></CardContent></Card>
                <Card className="border-card-border"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="h-3.5 w-3.5" /> Campaign Revenue</div><p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>—</p></CardContent></Card>
              </div>
              <Card className="border-card-border"><CardContent className="p-0"><div className="overflow-x-auto scrollbar-thin"><table className="w-full"><thead><tr className="border-b border-card-border bg-muted/30"><th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Campaign</th><th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tournament</th><th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</th><th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th><th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Audience</th><th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Open</th><th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Click</th><th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reg.</th><th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Revenue</th><th className="px-4 py-2.5"></th></tr></thead><tbody>{campaignList.map((c) => { const Icon = typeIcons[c.type] || Mail; return (<tr key={c.id} className="border-b border-card-border/50 transition-colors hover:bg-muted/20" data-testid={`row-campaign-${c.id}`}><td className="px-4 py-3"><div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-semibold text-foreground">{c.name}</span></div><span className="text-[10px] text-muted-foreground">{c.template}</span></td><td className="px-4 py-3"><span className="text-xs text-muted-foreground">{c.tournamentName}</span></td><td className="px-4 py-3"><Badge variant="outline" className="text-[10px] uppercase">{c.type}</Badge></td><td className="px-4 py-3"><Badge variant="outline" className={cn("text-[10px]", statusColors[c.status])}>{c.status}</Badge></td><td className="px-4 py-3"><span className="text-xs tabular-nums text-foreground">{c.audience}</span></td><td className="px-4 py-3"><span className="text-xs tabular-nums text-foreground">{c.openRate.toFixed(1)}%</span></td><td className="px-4 py-3"><span className="text-xs tabular-nums text-foreground">{c.clickRate.toFixed(1)}%</span></td><td className="px-4 py-3"><span className="text-xs tabular-nums font-semibold text-primary">{c.registrations}</span></td><td className="px-4 py-3"><span className="text-xs tabular-nums font-semibold text-foreground">${(c.revenue / 1000).toFixed(1)}k</span></td><td className="px-4 py-3"><button onClick={() => handleDeleteCampaign(c.id)} className="text-muted-foreground hover:text-red-500 transition-colors" data-testid={`button-delete-campaign-${c.id}`} title="Delete campaign"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/></svg></button></td></tr>); })}</tbody></table></div></CardContent></Card>
            </>
          )}
        </TabsContent>

        {/* Campaign Builder */}
        <TabsContent value="studio" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-1">
              <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>1. Choose Template</h3>
              {campaignTemplates.map((tpl) => (
                <button key={tpl.id} onClick={() => { setSelectedTemplate(tpl.id); setGenerated(false); }} className={cn("w-full rounded-lg border p-3 text-left transition-all", selectedTemplate === tpl.id ? "border-primary bg-primary/5 glow-primary" : "border-card-border hover:border-primary/30")} data-testid={`button-template-${tpl.id}`}>
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold text-foreground">{tpl.name}</span><Badge variant="outline" className="text-[9px]">{tpl.category}</Badge></div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{tpl.description}</p>
                  <div className="mt-2 flex gap-1">{tpl.channels.map((ch) => (<span key={ch} className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">{ch}</span>))}</div>
                </button>
              ))}
            </div>
            <div className="space-y-4 lg:col-span-2">
              <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>2. Configure Campaign</h3>
              {!selectedTemplate ? (
                <Card className="border-card-border"><CardContent className="flex flex-col items-center justify-center py-16 text-center"><Sparkles className="mb-3 h-8 w-8 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">Select a template to start building your campaign.</p></CardContent></Card>
              ) : (
                <>
                  <Card className="border-card-border"><CardContent className="space-y-4 p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Tournament</Label><select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground" data-testid="select-campaign-tournament"><option value="">Select tournament...</option>{tournaments.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}</select></div>
                      <div><Label className="text-xs">Campaign Name</Label><Input placeholder="e.g., 14U Recovery Push" className="mt-1 text-xs" data-testid="input-campaign-name" /></div>
                    </div>
                    <div><Label className="text-xs">Target Audience Description</Label><Textarea placeholder="e.g., 14U baseball coaches within 150 miles who played a Player1 event in the last 2 years but haven't registered" className="mt-1 text-xs" rows={2} data-testid="input-audience-description" /></div>
                    <Button onClick={handleGenerate} className="w-full bg-primary text-primary-foreground glow-primary hover:bg-primary/90" data-testid="button-generate-campaign"><Sparkles className="mr-1.5 h-3.5 w-3.5" />Generate Campaign with AI</Button>
                  </CardContent></Card>
                  {generated && (
                    <div className="space-y-3">
                      <Card className="border-primary/20"><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}><Mail className="h-4 w-4 text-primary" /> Email Draft</CardTitle><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleCopy("email", "email")} data-testid="button-copy-email">{copied === "email" ? <><Check className="mr-1 h-3 w-3" /> Copied</> : <><Copy className="mr-1 h-3 w-3" /> Copy</>}</Button></div></CardHeader><CardContent className="space-y-3 pt-0"><div><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Subject Line</Label><p className="text-xs text-foreground">14U Baseball Spots Open — Northeast Summer Classic, July 18-20</p></div><div><Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Alternate Subject</Label><p className="text-xs text-foreground">Only 8 spots remain in 14U — Register now for Harrisburg</p></div><div className="rounded-lg border border-card-border bg-muted/30 p-3"><p className="text-xs text-foreground">Coach [First Name],<br /><br />Spots are still open for the 14U division at the Northeast Summer Classic in Harrisburg, PA on July 18-20. You played in this event last year — we'd love to have your team back.<br /><br />Only 8 spots remain. Early-bird pricing ends July 1.<br /><br />[Register Now Button]<br /><br />See you on the diamond,<br />Mike Reynolds<br />Player1 Press Box</p></div></CardContent></Card>
                      <Card className="border-card-border"><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}><MessageSquare className="h-4 w-4 text-primary" /> SMS Draft</CardTitle><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleCopy("sms", "sms")} data-testid="button-copy-sms">{copied === "sms" ? <><Check className="mr-1 h-3 w-3" /> Copied</> : <><Copy className="mr-1 h-3 w-3" /> Copy</>}</Button></div></CardHeader><CardContent className="pt-0"><div className="rounded-lg border border-card-border bg-muted/30 p-3"><p className="text-xs text-foreground">14U Baseball: 8 spots left for Northeast Summer Classic in Harrisburg, PA (July 18-20). You played last year — early-bird ends July 1. Register: [link] Reply STOP to opt out.</p></div></CardContent></Card>
                      <Card className="border-card-border"><CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2 text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}><Share2 className="h-4 w-4 text-primary" /> Social Post</CardTitle><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleCopy("social", "social")} data-testid="button-copy-social">{copied === "social" ? <><Check className="mr-1 h-3 w-3" /> Copied</> : <><Copy className="mr-1 h-3 w-3" /> Copy</>}</Button></div></CardHeader><CardContent className="pt-0"><div className="rounded-lg border border-card-border bg-muted/30 p-3"><p className="text-xs text-foreground">BASEBALL SEASON IS HERE! 14U spots still open for the Northeast Summer Classic in Harrisburg, PA — July 18-20. 8 spots left. Early-bird pricing ends July 1. Register now! [link] #Player1 #YouthBaseball #NortheastSummerClassic</p></div></CardContent></Card>
                      <Card className="border-card-border"><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Suggested Schedule</CardTitle></CardHeader><CardContent className="space-y-2 pt-0"><div className="flex items-center justify-between rounded-lg border border-card-border px-3 py-2"><span className="text-xs text-foreground">Email launch</span><span className="text-xs font-medium text-primary">Today, 10:00 AM</span></div><div className="flex items-center justify-between rounded-lg border border-card-border px-3 py-2"><span className="text-xs text-foreground">SMS to non-openers</span><span className="text-xs font-medium text-primary">+4 days, 2:00 PM</span></div><div className="flex items-center justify-between rounded-lg border border-card-border px-3 py-2"><span className="text-xs text-foreground">Social post</span><span className="text-xs font-medium text-primary">+2 days, 9:00 AM</span></div><div className="flex items-center justify-between rounded-lg border border-card-border px-3 py-2"><span className="text-xs text-foreground">Final capacity reminder</span><span className="text-xs font-medium text-primary">72h before close</span></div></CardContent></Card>
                      <div className="flex gap-3"><Button variant="outline" className="flex-1" data-testid="button-save-draft">Save Draft</Button><Button className="flex-1 bg-primary text-primary-foreground glow-primary hover:bg-primary/90" data-testid="button-schedule-campaign"><Send className="mr-1.5 h-3.5 w-3.5" /> Schedule Campaign</Button></div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* SMS Blast via Quo */}
        <TabsContent value="sms" className="space-y-4">
          {numbersLoading ? (
            <Card className="border-card-border"><CardContent className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="ml-2 text-sm text-muted-foreground">Loading Quo numbers and teams...</span></CardContent></Card>
          ) : (
            <>
              {/* SMS Result Banner */}
              {smsResult && (
                <Card className={cn("border", smsResult.failed > 0 ? "border-amber-500/30 bg-amber-500/5" : "border-emerald-500/30 bg-emerald-500/5")}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {smsResult.failed > 0 ? <AlertCircle className="h-5 w-5 text-amber-500" /> : <Check className="h-5 w-5 text-emerald-500" />}
                      <div>
                        <p className="text-sm font-semibold text-foreground">SMS Blast Complete</p>
                        <p className="text-xs text-muted-foreground">{smsResult.succeeded} delivered, {smsResult.failed} failed out of {smsResult.total} total</p>
                      </div>
                    </div>
                    {smsResult.results?.filter((r: any) => !r.success).length > 0 && (
                      <div className="mt-3 space-y-1">
                        {smsResult.results.filter((r: any) => !r.success).slice(0, 5).map((r: any, i: number) => (
                          <div key={i} className="text-xs text-amber-500">{r.phone}: {r.error || "Failed"}</div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {smsError && (
                <Card className="border-red-500/30 bg-red-500/5"><CardContent className="p-4"><div className="flex items-center gap-3"><AlertCircle className="h-5 w-5 text-red-500" /><p className="text-sm text-red-500">{smsError}</p></div></CardContent></Card>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left: Sender + Message */}
                <div className="space-y-4 lg:col-span-1">
                  <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>1. Sender & Message</h3>

                  {/* Sender Number */}
                  <Card className="border-card-border">
                    <CardContent className="space-y-3 p-4">
                      <div>
                        <Label className="text-xs">Send From</Label>
                        <select value={selectedFrom} onChange={(e) => setSelectedFrom(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground">
                          {quoNumbers.map((n) => (<option key={n.id} value={n.number}>{n.name || n.label} — {n.number}</option>))}
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Message Composer */}
                  <Card className="border-card-border">
                    <CardContent className="space-y-3 p-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs">Message Content</Label>
                          <span className={cn("text-[10px]", charCount > 1600 ? "text-red-500" : charCount > 160 ? "text-amber-500" : "text-muted-foreground")}>{charCount} / 1600 · {segments} segment{segments !== 1 ? "s" : ""}</span>
                        </div>
                        <Textarea value={smsContent} onChange={(e) => setSmsContent(e.target.value)} placeholder="e.g., 14U Baseball: 8 spots left for Northeast Summer Classic in Harrisburg, PA (July 18-20). Early-bird ends July 1. Register: [link] Reply STOP to opt out." className="text-xs" rows={6} data-testid="textarea-sms-content" />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{selectedPhones.length} recipients selected</span>
                        <span>·</span>
                        <span>Est. cost: ${((selectedPhones.length * segments * 0.01).toFixed(2))}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Send Button */}
                  <Button onClick={handleSendSms} disabled={smsLoading || !selectedFrom || selectedPhones.length === 0 || !smsContent || charCount > 1600} className="w-full bg-primary text-primary-foreground glow-primary hover:bg-primary/90 disabled:opacity-50" data-testid="button-send-sms">
                    {smsLoading ? (<><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Sending...</>) : (<><Send className="mr-1.5 h-3.5 w-3.5" /> Send to {selectedPhones.length} Teams</>)}
                  </Button>
                </div>

                {/* Right: Team Selection */}
                <div className="space-y-4 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>2. Select Recipients</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={selectAllFiltered} data-testid="button-select-all">Select All ({filteredTeams.length})</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={clearSelection}>Clear</Button>
                    </div>
                  </div>

                  {/* Filters */}
                  <Card className="border-card-border">
                    <CardContent className="space-y-3 p-3">
                      <div className="flex flex-wrap gap-2">
                        <div className="relative flex-1 min-w-[180px]">
                          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                          <Input value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} placeholder="Search teams or coaches..." className="pl-8 text-xs" data-testid="input-team-search" />
                        </div>
                        <select value={sportFilter} onChange={(e) => setSportFilter(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground">
                          <option value="">All Sports</option>
                          {sports.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground">
                          <option value="">All States</option>
                          {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team List */}
                  <Card className="border-card-border">
                    <CardContent className="p-0">
                      <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
                        {filteredTeams.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Phone className="mb-2 h-6 w-6 text-muted-foreground/40" />
                            <p className="text-xs text-muted-foreground">No teams match your filters</p>
                          </div>
                        ) : (
                          filteredTeams.map((team) => (
                            <button
                              key={team.id}
                              onClick={() => toggleTeam(team.id)}
                              className={cn("flex w-full items-center gap-3 border-b border-card-border/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/20", selectedTeamIds.has(team.id) && "bg-primary/5")}
                              data-testid={`button-team-${team.id}`}
                            >
                              <div className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", selectedTeamIds.has(team.id) ? "border-primary bg-primary" : "border-card-border")}>
                                {selectedTeamIds.has(team.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-foreground">{team.team_name}</p>
                                <p className="text-[10px] text-muted-foreground">{team.coach_name || "No coach"} · {team.phone}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {team.sport && <Badge variant="outline" className="text-[9px]">{team.sport}</Badge>}
                                {team.state && <span className="text-[10px] text-muted-foreground">{team.state}</span>}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Selection Summary */}
                  {selectedTeams.length > 0 && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-xs font-semibold text-foreground">{selectedTeams.length} team{selectedTeams.length !== 1 ? "s" : ""} selected</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{selectedTeams.filter(t => t.email).length} with email · {selectedTeams.length} with phone</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
