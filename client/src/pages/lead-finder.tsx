import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { fetchPressTeams, type PressTeam } from "@/lib/supabase";
import {
  Search,
  Users,
  Globe,
  ClipboardPaste,
  Loader2,
  Plus,
  Check,
  X,
  Target,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Trash2,
  Radar,
  MapPin,
} from "lucide-react";

interface Lead {
  id: string;
  team_name: string;
  coach_name: string | null;
  phone: string | null;
  email: string | null;
  sport: string | null;
  age_group: string | null;
  city: string | null;
  state: string | null;
  source_url: string | null;
  source_type: string;
  confidence: number;
  status: string;
  created_at: string;
}

export default function LeadFinder() {
  const { token } = useAuth();
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [activeTab, setActiveTab] = useState<"url" | "text" | "hunt">("url");
  const [extracting, setExtracting] = useState(false);
  const [hunting, setHunting] = useState(false);

  // Area Hunt form state
  const [huntSport, setHuntSport] = useState("Baseball");
  const [huntAge, setHuntAge] = useState("");
  const [huntState, setHuntState] = useState("");
  const [huntCity, setHuntCity] = useState("");
  const [huntRadius, setHuntRadius] = useState(50);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pressTeams, setPressTeams] = useState<PressTeam[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "confidence">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "imported" | "rejected">("all");

  useEffect(() => {
    if (!token) return;
    async function load() {
      try {
        const [pressTeamsData, leadsData] = await Promise.all([
          fetchPressTeams(),
          fetch(`/api/leads/list?status=all`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setPressTeams(pressTeamsData);
        if (leadsData.ok) {
          const l = await leadsData.json();
          setLeads(l);
        }
      } catch (e) {
        console.error("Lead Finder load error:", e);
      } finally {
        setLoadingLeads(false);
      }
    }
    load();
  }, [token]);

  const pressTeamNames = useMemo(() => new Set(pressTeams.map(t => t.team_name.toLowerCase())), [pressTeams]);

  const toggleSort = (col: "date" | "name" | "confidence") => {
    if (sortBy === col) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir(col === "date" ? "desc" : "asc");
    }
  };

  const filteredLeads = useMemo(() => {
    let filtered = leads;
    if (statusFilter !== "all") {
      filtered = filtered.filter(l => l.status === statusFilter);
    }
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "name") {
        cmp = (a.team_name || "").localeCompare(b.team_name || "");
      } else {
        cmp = a.confidence - b.confidence;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [leads, statusFilter, sortBy, sortDir]);

  const handleExtract = async () => {
    if (!token) return;
    if (activeTab === "url" && !url) return;
    if (activeTab === "text" && !pastedText) return;
    setExtracting(true);
    setError("");
    try {
      const resp = await fetch("/api/leads/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(activeTab === "url" ? { url } : { pastedText }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Extraction failed");
      if (data.leads && data.leads.length > 0) {
        // Prepend new leads
        setLeads(prev => [...data.leads, ...prev]);
      }
      if (data.message) {
        setError(data.message);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleHunt = async () => {
    if (!token) return;
    if (!huntSport || !huntState) return;
    setHunting(true);
    setError("");
    try {
      const resp = await fetch("/api/leads/area-hunt", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sport: huntSport,
          ageGroup: huntAge,
          state: huntState,
          city: huntCity,
          radius: huntRadius,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Hunt failed");
      if (data.leads && data.leads.length > 0) {
        setLeads(prev => [...data.leads, ...prev]);
      } else {
        setError("No teams found in this area. Try broadening your search.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setHunting(false);
    }
  };

  const handleImport = async (leadId: string) => {
    if (!token) return;
    setImportingId(leadId);
    try {
      const resp = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leadId }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Import failed");
      setImportedIds(prev => new Set([...prev, leadId]));
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: "imported" } : l));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setImportingId(null);
    }
  };

  const handleImportAll = async () => {
    if (!token) return;
    const toImport = filteredLeads.filter(l => {
      const inHub = pressTeamNames.has(l.team_name.toLowerCase());
      const alreadyImported = importedIds.has(l.id) || l.status === "imported";
      return !inHub && !alreadyImported;
    });
    if (toImport.length === 0) return;
    setImportingId("all");
    const newImported = new Set(importedIds);
    for (const lead of toImport) {
      try {
        const resp = await fetch("/api/leads/import", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ leadId: lead.id }),
        });
        if (resp.ok) {
          newImported.add(lead.id);
        }
      } catch (e) { /* continue */ }
    }
    setImportedIds(newImported);
    setLeads(prev => prev.map(l => newImported.has(l.id) ? { ...l, status: "imported" } : l));
    setImportingId(null);
  };

  const handleReject = async (leadId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/leads/list`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leadId, status: "rejected" }),
      });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: "rejected" } : l));
    } catch (e) { /* ignore */ }
  };

  const notInHubCount = filteredLeads.filter(l => {
    const inHub = pressTeamNames.has(l.team_name.toLowerCase());
    return !inHub && !importedIds.has(l.id) && l.status !== "imported";
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Lead Finder</h2>
        <p className="mt-1 text-sm text-muted-foreground">Collect team info from tournament websites, paste text, or Facebook posts. Review and add to your Audience Hub.</p>
      </div>

      {/* Input Section */}
      <Card className="border-card-border">
        <CardContent className="p-4 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("url")}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", activeTab === "url" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}
            >
              <Globe className="h-3.5 w-3.5" /> From URL
            </button>
            <button
              onClick={() => setActiveTab("text")}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", activeTab === "text" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}
            >
              <ClipboardPaste className="h-3.5 w-3.5" /> Pasted Text
            </button>
            <button
              onClick={() => setActiveTab("hunt")}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", activeTab === "hunt" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}
            >
              <Radar className="h-3.5 w-3.5" /> Area Hunt
            </button>
          </div>

          {activeTab === "url" ? (
            <div className="space-y-2">
              <Label className="text-xs">Tournament or Team Directory URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/tournament/teams"
                    className="pl-9 text-sm"
                    data-testid="input-lead-url"
                  />
                </div>
                <Button onClick={handleExtract} disabled={extracting || !url} className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90">
                  {extracting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Extracting...</> : <><Search className="mr-1.5 h-3.5 w-3.5" /> Extract Teams</>}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Paste a tournament page, team directory, or schedule page. The system will look for team names, phone numbers, and emails.</p>
            </div>
          ) : activeTab === "text" ? (
            <div className="space-y-2">
              <Label className="text-xs">Paste team data from any source (Facebook posts, spreadsheets, emails, etc.)</Label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={"Team Name, Coach, Phone, Email\nTigers Baseball, Coach Smith, 555-123-4567, coach@email.com\n..."}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground min-h-[120px] font-mono"
                data-testid="input-lead-text"
              />
              <Button onClick={handleExtract} disabled={extracting || !pastedText} className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90">
                {extracting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Parsing...</> : <><Search className="mr-1.5 h-3.5 w-3.5" /> Parse Teams</>}
              </Button>
            </div>
          ) : activeTab === "hunt" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Sport</Label>
                  <select
                    value={huntSport}
                    onChange={(e) => setHuntSport(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground"
                  >
                    <option value="Baseball">Baseball</option>
                    <option value="Fastpitch">Fastpitch</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Age Group</Label>
                  <Input
                    value={huntAge}
                    onChange={(e) => setHuntAge(e.target.value)}
                    placeholder="e.g. 12U, 14U"
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">State</Label>
                  <Input
                    value={huntState}
                    onChange={(e) => setHuntState(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="e.g. NY"
                    className="text-xs h-8"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">City (optional)</Label>
                  <Input
                    value={huntCity}
                    onChange={(e) => setHuntCity(e.target.value)}
                    placeholder="e.g. Rochester"
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Radius (mi)</Label>
                  <Input
                    type="number"
                    value={huntRadius}
                    onChange={(e) => setHuntRadius(parseInt(e.target.value) || 50)}
                    className="text-xs h-8"
                    min={10}
                    max={500}
                  />
                </div>
              </div>
              <Button onClick={handleHunt} disabled={hunting || !huntSport || !huntState} className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90 w-full">
                {hunting ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Hunting teams in {huntState}...</> : <><Radar className="mr-1.5 h-3.5 w-3.5" /> Hunt Teams</>}
              </Button>
              <p className="text-[10px] text-muted-foreground">Searches tournament directories, sanctioning body sites (USSSA, Perfect Game), and web results for teams matching your criteria. Results appear in the table below.</p>
            </div>
          ) : null}

          {error && (
            <p className="text-xs text-amber-500">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Collected Leads ({filteredLeads.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Status filter */}
              <div className="flex gap-1">
                {(["all", "new", "imported", "rejected"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn("rounded px-2 py-1 text-[10px] font-medium transition-colors", statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70")}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              {notInHubCount > 0 && (
                <Button size="sm" onClick={handleImportAll} disabled={importingId === "all"} className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90 h-7 text-xs">
                  {importingId === "all" ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Importing...</> : <>+ Add All ({notInHubCount})</>}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingLeads ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No leads yet. Extract from a URL or paste team data above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border bg-muted/30">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground">
                        Team {sortBy === "name" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Coach</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <button onClick={() => toggleSort("confidence")} className="flex items-center gap-1 hover:text-foreground">
                        Confidence {sortBy === "confidence" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Source</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <button onClick={() => toggleSort("date")} className="flex items-center gap-1 hover:text-foreground">
                        Found {sortBy === "date" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const inHub = pressTeamNames.has(lead.team_name.toLowerCase()) || importedIds.has(lead.id);
                    const isImported = inHub || lead.status === "imported";
                    const isRejected = lead.status === "rejected";
                    return (
                      <tr key={lead.id} className={cn("border-b border-card-border/50 transition-colors hover:bg-muted/20", isRejected && "opacity-40")}>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-foreground">{lead.team_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">{lead.coach_name || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {lead.phone && <p className="text-[10px] text-foreground">{lead.phone}</p>}
                            {lead.email && <p className="text-[10px] text-emerald-500">{lead.email}</p>}
                            {!lead.phone && !lead.email && <span className="text-[10px] text-muted-foreground">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">{lead.city ? `${lead.city}, ` : ""}{lead.state || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[10px]", lead.confidence >= 70 ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : lead.confidence >= 50 ? "border-amber-500/20 bg-amber-500/10 text-amber-500" : "border-muted-foreground/20 bg-muted text-muted-foreground")}>
                            {lead.confidence}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {lead.source_url && lead.source_url !== "pasted-text" ? (
                            <a href={lead.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                              <ExternalLink className="h-2.5 w-2.5" /> {lead.source_type}
                            </a>
                          ) : (
                            <Badge variant="outline" className="text-[9px]">{lead.source_type}</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] text-muted-foreground">{new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </td>
                        <td className="px-4 py-3">
                          {isImported ? (
                            <Badge variant="outline" className="text-[10px] border-emerald-500/20 bg-emerald-500/10 text-emerald-500">In Hub</Badge>
                          ) : isRejected ? (
                            <Badge variant="outline" className="text-[10px] border-red-500/20 bg-red-500/10 text-red-500">Rejected</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-blue-500/20 bg-blue-500/10 text-blue-500">New</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {!isImported && !isRejected && (
                              <button onClick={() => handleImport(lead.id)} disabled={importingId === lead.id} className="text-muted-foreground hover:text-primary transition-colors p-1 disabled:opacity-50" title="Add to Audience Hub">
                                {importingId === lead.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                              </button>
                            )}
                            {!isImported && !isRejected && (
                              <button onClick={() => handleReject(lead.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1" title="Reject lead">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
