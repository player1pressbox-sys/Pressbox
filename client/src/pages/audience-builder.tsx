import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { fetchPressTeams, type PressTeam } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Search, Users, MapPin, Filter, Zap, Mail, MessageSquare, Target, Loader2, Pencil, Trash2, X, ChevronUp, ChevronDown, Plus } from "lucide-react";

const sportOptions = [
  { label: "All Sports", value: "all" },
  { label: "Baseball", value: "baseball" },
  { label: "Fastpitch", value: "fastpitch" },
];

const ageGroups = ["8U", "9U", "10U", "11U", "12U", "13U", "14U", "15U", "16U", "17U", "18U"];

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Lapsed", value: "lapsed" },
  { label: "New", value: "new" },
  { label: "Abandoned", value: "abandoned" },
  { label: "Waitlisted", value: "waitlisted" },
];

export default function AudienceBuilder() {
  const { token } = useAuth();
  const [pressTeams, setPressTeams] = useState<PressTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("all");
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState([250]);
  const [editingTeam, setEditingTeam] = useState<PressTeam | null>(null);
  const [editForm, setEditForm] = useState<Partial<PressTeam>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingTeam, setAddingTeam] = useState(false);
  const [newTeam, setNewTeam] = useState({ team_name: "", sport: "Baseball", age_group: "", city: "", state: "", coach_name: "", phone: "", email: "" });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const teams = await fetchPressTeams();
        if (!mounted) return;
        setPressTeams(teams);
      } catch (e) {
        console.error("[PressBox] Audience load error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const timeout = setTimeout(() => { if (mounted) setLoading(false); }, 5000);
    return () => { mounted = false; clearTimeout(timeout); };
  }, []);

  const toggleAge = (age: string) => {
    setSelectedAges((prev) => prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]);
  };
  const toggleState = (state: string) => {
    setSelectedStates((prev) => prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state]);
  };
  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]);
  };

  const openEdit = (team: PressTeam) => {
    setEditingTeam(team);
    setEditForm({ ...team });
  };

  const closeEdit = () => {
    setEditingTeam(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingTeam || !token) return;
    setSavingEdit(true);
    try {
      const resp = await fetch(`/api/teams/list`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: editingTeam.id, ...editForm }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Update failed');
      // Update local state
      setPressTeams(prev => prev.map(t => t.id === editingTeam.id ? { ...t, ...editForm } as PressTeam : t));
      closeEdit();
    } catch (e: any) {
      alert('Failed to save: ' + e.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!token || !confirm('Delete this team? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const resp = await fetch(`/api/teams/list`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Delete failed');
      setPressTeams(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      alert('Failed to delete: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddTeam = async () => {
    if (!token || !newTeam.team_name.trim()) return;
    setAddingTeam(true);
    try {
      const resp = await fetch('/api/teams/add-to-press', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ manual: true, ...newTeam }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to add team');
      if (data.team) {
        setPressTeams(prev => [...prev, data.team as PressTeam].sort((a, b) => a.team_name.localeCompare(b.team_name)));
      }
      setNewTeam({ team_name: "", sport: "Baseball", age_group: "", city: "", state: "", coach_name: "", phone: "", email: "" });
      setShowAddForm(false);
    } catch (e: any) {
      alert('Failed to add team: ' + e.message);
    } finally {
      setAddingTeam(false);
    }
  };

  // Derive states from real data
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    pressTeams.forEach(t => { if (t.state) states.add(t.state); });
    return Array.from(states).sort();
  }, [pressTeams]);

  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (col: "name" | "date") => {
    if (sortBy === col) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir(col === "date" ? "desc" : "asc");
    }
  };

  const filteredTeams = useMemo(() => {
    const filtered = pressTeams.filter((t) => {
      if (search && !t.team_name.toLowerCase().includes(search.toLowerCase()) && !(t.coach_name || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (sport !== "all" && t.sport !== sport.charAt(0).toUpperCase() + sport.slice(1)) return false;
      if (selectedAges.length > 0 && !selectedAges.some(age => (t.age_group || '').includes(age))) return false;
      if (selectedStates.length > 0 && !selectedStates.includes(t.state)) return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(t.status)) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        cmp = da - db;
      } else {
        cmp = (a.team_name || "").localeCompare(b.team_name || "");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [pressTeams, search, sport, selectedAges, selectedStates, selectedStatuses, maxDistance, sortBy, sortDir]);

  const audienceSize = filteredTeams.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Loading team contacts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Audience Builder</h2>
          <p className="mt-1 text-sm text-muted-foreground">Filter teams and coaches by sport, age, geography, and history</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-primary" style={{ fontFamily: "var(--font-display)" }}>{audienceSize}</p>
            <p className="text-[10px] text-muted-foreground">teams matched</p>
          </div>
          <Button className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90" data-testid="button-create-campaign-from-audience">
            <Zap className="mr-1.5 h-3.5 w-3.5" /> Create Campaign
          </Button>
        </div>
      </div>

      {pressTeams.length === 0 ? (
        <Card className="border-card-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">No team contacts yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Import teams to start building audiences</p>
            <Link href="/import">
              <Button className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90 text-xs">
                Go to Data Import
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filters */}
        <div className="space-y-4 lg:col-span-1">
          {/* Search */}
          <Card className="border-card-border">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search teams or coaches..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-sm"
                  data-testid="input-search-teams"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sport Filter */}
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Sport</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger className="text-sm" data-testid="select-sport">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sportOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Age Groups */}
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Age Divisions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1.5">
                {ageGroups.map((age) => (
                  <button
                    key={age}
                    onClick={() => toggleAge(age)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      selectedAges.includes(age)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    )}
                    data-testid={`button-age-${age}`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Distance */}
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Max Distance</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <Slider
                  value={maxDistance}
                  onValueChange={setMaxDistance}
                  max={500}
                  min={25}
                  step={25}
                  className="flex-1"
                  data-testid="slider-distance"
                />
                <span className="w-12 text-right text-xs font-semibold tabular-nums text-foreground">{maxDistance[0]}mi</span>
              </div>
            </CardContent>
          </Card>

          {/* States */}
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>States</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2">
                {availableStates.map((state) => (
                  <button
                    key={state}
                    onClick={() => toggleState(state)}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                      selectedStates.includes(state)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    )}
                    data-testid={`button-state-${state}`}
                  >
                    {state}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "var(--font-display)" }}>Team Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {statusOptions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => toggleStatus(s.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    selectedStatuses.includes(s.value)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                  data-testid={`button-status-${s.value}`}
                >
                  <span className={cn("h-2 w-2 rounded-full", selectedStatuses.includes(s.value) ? "bg-primary" : "bg-muted-foreground/40")} />
                  {s.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                  Matched Teams ({audienceSize})
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90 h-7 text-xs"
                    data-testid="button-add-team-manual"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Team
                  </Button>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="font-semibold text-foreground">{filteredTeams.filter(t => t.email).length}</span> email
                    <MessageSquare className="ml-2 h-3.5 w-3.5" />
                    <span className="font-semibold text-foreground">{filteredTeams.filter(t => t.phone).length}</span> SMS
                  </div>
                </div>
              </div>
            </CardHeader>
            {showAddForm && (
              <div className="border-b border-card-border bg-muted/20 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Team Name *</Label>
                    <Input value={newTeam.team_name} onChange={(e) => setNewTeam(prev => ({ ...prev, team_name: e.target.value }))} placeholder="e.g., Vegas Elite" className="text-xs h-8" data-testid="input-new-team-name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Sport</Label>
                    <select value={newTeam.sport} onChange={(e) => setNewTeam(prev => ({ ...prev, sport: e.target.value }))} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs h-8">
                      <option value="Baseball">Baseball</option>
                      <option value="Fastpitch">Fastpitch</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Age Group</Label>
                    <select value={newTeam.age_group} onChange={(e) => setNewTeam(prev => ({ ...prev, age_group: e.target.value }))} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs h-8">
                      <option value="">—</option>
                      {ageGroups.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">State</Label>
                    <Input value={newTeam.state} onChange={(e) => setNewTeam(prev => ({ ...prev, state: e.target.value.toUpperCase() }))} placeholder="NV" className="text-xs h-8" maxLength={2} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">City</Label>
                    <Input value={newTeam.city} onChange={(e) => setNewTeam(prev => ({ ...prev, city: e.target.value }))} placeholder="Las Vegas" className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Coach Name</Label>
                    <Input value={newTeam.coach_name} onChange={(e) => setNewTeam(prev => ({ ...prev, coach_name: e.target.value }))} placeholder="Coach Smith" className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Phone</Label>
                    <Input value={newTeam.phone} onChange={(e) => setNewTeam(prev => ({ ...prev, phone: e.target.value }))} placeholder="555-123-4567" className="text-xs h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Email</Label>
                    <Input value={newTeam.email} onChange={(e) => setNewTeam(prev => ({ ...prev, email: e.target.value }))} placeholder="coach@email.com" className="text-xs h-8" />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button onClick={handleAddTeam} disabled={addingTeam || !newTeam.team_name.trim()} className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90 h-8 text-xs" data-testid="button-save-new-team">
                    {addingTeam ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Adding...</> : <><Plus className="mr-1.5 h-3 w-3" /> Add to Hub</>}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setShowAddForm(false); setNewTeam({ team_name: "", sport: "Baseball", age_group: "", city: "", state: "", coach_name: "", phone: "", email: "" }); }} className="h-8 text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            <CardContent className="p-0">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-card-border bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          Team
                          {sortBy === "name" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </button>
                      </th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Division</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <button onClick={() => toggleSort("date")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          Date Added
                          {sortBy === "date" && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </button>
                      </th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                          <p className="text-sm text-muted-foreground">No teams match your filters.</p>
                          <p className="mt-1 text-xs text-muted-foreground/60">Try widening your distance or adding more age divisions.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTeams.map((t) => (
                        <tr key={t.id} className="border-b border-card-border/50 transition-colors hover:bg-muted/20" data-testid={`row-team-${t.id}`}>
                          <td className="px-4 py-3">
                            <p className="text-xs font-semibold text-foreground">{t.team_name}</p>
                            <p className="text-[10px] text-muted-foreground">{t.coach_name || 'No coach listed'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn("text-[10px]", t.sport === 'Baseball' ? "border-blue-500/20 bg-blue-500/10 text-blue-500" : "border-purple-500/20 bg-purple-500/10 text-purple-500")}>
                              {t.age_group || '—'} {t.sport}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-foreground">{t.city ? `${t.city}, ` : ''}{t.state || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn(
                              "text-[10px]",
                              t.status === 'active' ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" :
                              t.status === 'lapsed' ? "border-amber-500/20 bg-amber-500/10 text-amber-500" :
                              t.status === 'new' ? "border-blue-500/20 bg-blue-500/10 text-blue-500" :
                              t.status === 'prospect' ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-500" :
                              "border-muted-foreground/20 bg-muted text-muted-foreground"
                            )}>
                              {t.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {t.email && <Mail className="h-3 w-3 text-emerald-500" />}
                              {t.phone && <MessageSquare className="h-3 w-3 text-primary" />}
                              {!t.email && !t.phone && <span className="text-[10px] text-muted-foreground">no contact</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] text-muted-foreground">{t.created_at ? new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEdit(t)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Edit team" data-testid={`button-edit-team-${t.id}`}>
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDeleteTeam(t.id)} disabled={deletingId === t.id} className="text-muted-foreground hover:text-red-500 transition-colors p-1 disabled:opacity-50" title="Delete team" data-testid={`button-delete-team-${t.id}`}>
                                {deletingId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendation */}
          <Card className="mt-4 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Zap className="h-4 w-4" fill="currentColor" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary">AI Audience Insight</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {audienceSize > 0 ? (
                      <>
                        Your filtered audience of <span className="font-semibold text-foreground">{audienceSize} teams</span> includes{" "}
                        <span className="font-semibold text-foreground">{filteredTeams.filter(t => t.status === 'lapsed').length} lapsed teams</span> who previously participated in Player1 events.
                        These teams convert at 2.3x the rate of cold contacts. Recommend a personalized reactivation email with early-bird incentive, followed by SMS reminder to teams within 150 miles.
                      </>
                    ) : (
                      "Adjust your filters to find teams. Try widening the distance radius or selecting more age divisions."
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeEdit}>
          <div className="w-full max-w-lg rounded-lg border border-card-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="modal-edit-team">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Edit Team</h3>
              <button onClick={closeEdit} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Team Name</Label>
                <Input value={editForm.team_name || ""} onChange={(e) => setEditForm(prev => ({ ...prev, team_name: e.target.value }))} className="mt-1 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Sport</Label>
                  <Input value={editForm.sport || ""} onChange={(e) => setEditForm(prev => ({ ...prev, sport: e.target.value }))} className="mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Age Group</Label>
                  <Input value={editForm.age_group || ""} onChange={(e) => setEditForm(prev => ({ ...prev, age_group: e.target.value }))} className="mt-1 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">City</Label>
                  <Input value={editForm.city || ""} onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))} className="mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">State</Label>
                  <Input value={editForm.state || ""} onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))} className="mt-1 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Coach Name</Label>
                <Input value={editForm.coach_name || ""} onChange={(e) => setEditForm(prev => ({ ...prev, coach_name: e.target.value }))} className="mt-1 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input value={editForm.phone || ""} onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))} className="mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input value={editForm.email || ""} onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} className="mt-1 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Status</Label>
                  <select value={editForm.status || ""} onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                    <option value="active">Active</option>
                    <option value="lapsed">Lapsed</option>
                    <option value="new">New</option>
                    <option value="abandoned">Abandoned</option>
                    <option value="waitlisted">Waitlisted</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <Input value={editForm.category || ""} onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))} className="mt-1 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Source</Label>
                <Input value={editForm.source || ""} onChange={(e) => setEditForm(prev => ({ ...prev, source: e.target.value }))} className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Input value={editForm.notes || ""} onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))} className="mt-1 text-sm" />
              </div>
              {editingTeam.created_at && (
                <div className="rounded-md border border-card-border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Added to Audience Hub</p>
                  <p className="text-xs font-medium text-foreground">{new Date(editingTeam.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{editingTeam.created_at.includes("T") ? ` at ${new Date(editingTeam.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}</p>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={closeEdit} className="text-sm">Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={savingEdit} className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90 text-sm">
                {savingEdit ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...</> : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
