import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Upload,
  Link2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Database,
  Users,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react";

interface ImportRow {
  team_name: string;
  sport: string;
  age_group: string;
  city: string;
  state: string;
  coach_name: string;
  phone: string;
  email: string;
  source: string;
  status: "new" | "duplicate" | "selected";
}

// Mock preview data for URL import
const mockUrlImport: ImportRow[] = [
  { team_name: "Arizona Mavericks 10U", sport: "Baseball", age_group: "10U", city: "Phoenix", state: "AZ", coach_name: "Mark Thompson", phone: "602-555-0192", email: "mavericks10@gmail.com", source: "tournament-site.com/event/123", status: "new" },
  { team_name: "Desert Dogs 12U", sport: "Baseball", age_group: "12U", city: "Scottsdale", state: "AZ", coach_name: "Steve Garcia", phone: "480-555-0184", email: "", source: "tournament-site.com/event/123", status: "new" },
  { team_name: "Cactus Crushers 14U", sport: "Baseball", age_group: "14U", city: "Tucson", state: "AZ", coach_name: "James Wilson", phone: "520-555-0173", email: "crushers14u@outlook.com", source: "tournament-site.com/event/123", status: "duplicate" },
  { team_name: "Valley Vipers 9U", sport: "Baseball", age_group: "9U", city: "Phoenix", state: "AZ", coach_name: "Coach Mike", phone: "602-555-0156", email: "", source: "tournament-site.com/event/123", status: "new" },
  { team_name: "Sonoran Sandlot 11U", sport: "Baseball", age_group: "11U", city: "Mesa", state: "AZ", coach_name: "Dave Martinez", phone: "480-555-0134", email: "sonoransandlot@gmail.com", source: "tournament-site.com/event/123", status: "new" },
  { team_name: "Grand Canyon Gamers 13U", sport: "Baseball", age_group: "13U", city: "Flagstaff", state: "AZ", coach_name: "Rob Anderson", phone: "928-555-0123", email: "", source: "tournament-site.com/event/123", status: "new" },
];

export default function DataImport() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);
  const [urlResults, setUrlResults] = useState<ImportRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleUrlImport = () => {
    if (!url.trim()) return;
    setLoading(true);
    setImported(false);
    setUrlResults([]);
    setSelectedRows(new Set());

    // Simulate extraction
    setTimeout(() => {
      setUrlResults(mockUrlImport);
      // Pre-select all "new" rows
      const newRows = new Set<number>();
      mockUrlImport.forEach((row, idx) => {
        if (row.status === "new") newRows.add(idx);
      });
      setSelectedRows(newRows);
      setLoading(false);
      setImported(true);
    }, 2500);
  };

  const toggleRow = (idx: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set<number>();
    urlResults.forEach((_, idx) => all.add(idx));
    setSelectedRows(all);
  };

  const selectNone = () => {
    setSelectedRows(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Data Import</h2>
        <p className="mt-1 text-sm text-muted-foreground">Import team contacts from URLs, CSV files, or your database</p>
      </div>

      <Tabs defaultValue="url">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="url" className="text-xs"><Link2 className="mr-1.5 h-3.5 w-3.5" /> Import from URL</TabsTrigger>
          <TabsTrigger value="csv" className="text-xs"><FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> CSV Upload</TabsTrigger>
          <TabsTrigger value="database" className="text-xs"><Database className="mr-1.5 h-3.5 w-3.5" /> Database Import</TabsTrigger>
        </TabsList>

        {/* URL Import */}
        <TabsContent value="url" className="space-y-4">
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Extract Team Data from Tournament URL</CardTitle>
              <p className="text-xs text-muted-foreground">Paste a link to any tournament page (Playbook365, SportsEngine, etc.) and Press Box will extract publicly visible team listings.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://playbook365.com/tournaments/example-event"
                  className="text-xs"
                  data-testid="input-tournament-url"
                />
                <Button
                  onClick={handleUrlImport}
                  disabled={loading || !url.trim()}
                  className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90"
                  data-testid="button-extract-url"
                >
                  {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Link2 className="mr-1.5 h-3.5 w-3.5" />}
                  {loading ? "Extracting..." : "Extract"}
                </Button>
              </div>
              <div className="rounded-lg border border-dashed border-card-border bg-muted/20 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Supported Sites</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {["Playbook365", "SportsEngine", "Tournament Suite", "Bonzi", "Perfect Game", "USABL", "Custom Sites"].map((site) => (
                    <Badge key={site} variant="outline" className="text-[9px]">{site}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extraction Results */}
          {imported && urlResults.length > 0 && (
            <Card className="border-card-border" data-testid="card-extraction-results">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                    Extraction Results — {urlResults.length} teams found
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={selectAll} data-testid="button-select-all">Select All</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={selectNone} data-testid="button-select-none">Clear</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stats */}
                <div className="mb-3 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-card-border p-2 text-center">
                    <p className="text-[10px] text-muted-foreground">Selected</p>
                    <p className="text-lg font-bold text-primary" style={{ fontFamily: "var(--font-display)" }}>{selectedRows.size}</p>
                  </div>
                  <div className="rounded-lg border border-card-border p-2 text-center">
                    <p className="text-[10px] text-muted-foreground">New Teams</p>
                    <p className="text-lg font-bold text-emerald-500" style={{ fontFamily: "var(--font-display)" }}>{urlResults.filter(r => r.status === "new").length}</p>
                  </div>
                  <div className="rounded-lg border border-card-border p-2 text-center">
                    <p className="text-[10px] text-muted-foreground">Duplicates</p>
                    <p className="text-lg font-bold text-amber-500" style={{ fontFamily: "var(--font-display)" }}>{urlResults.filter(r => r.status === "duplicate").length}</p>
                  </div>
                </div>

                {/* Results Table */}
                <div className="max-h-[400px] overflow-y-auto scrollbar-thin rounded-lg border border-card-border">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="p-2 text-left"></th>
                        <th className="p-2 text-left">Team</th>
                        <th className="p-2 text-left">Sport</th>
                        <th className="p-2 text-left">Age</th>
                        <th className="p-2 text-left">Coach</th>
                        <th className="p-2 text-left">Contact</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {urlResults.map((row, idx) => (
                        <tr
                          key={idx}
                          className={cn(
                            "border-b border-card-border/50 text-xs hover:bg-muted/20",
                            selectedRows.has(idx) && "bg-primary/5"
                          )}
                          data-testid={`row-import-${idx}`}
                        >
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(idx)}
                              onChange={() => toggleRow(idx)}
                              className="h-3.5 w-3.5 accent-primary"
                              data-testid={`checkbox-import-${idx}`}
                            />
                          </td>
                          <td className="p-2 font-medium text-foreground">{row.team_name}</td>
                          <td className="p-2 text-muted-foreground">{row.sport}</td>
                          <td className="p-2 text-muted-foreground">{row.age_group}</td>
                          <td className="p-2 text-muted-foreground">{row.coach_name}</td>
                          <td className="p-2 text-muted-foreground">
                            {row.phone && <div className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {row.phone}</div>}
                            {row.email && <div className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {row.email}</div>}
                          </td>
                          <td className="p-2">
                            {row.status === "duplicate" ? (
                              <Badge variant="outline" className="bg-amber-500/15 text-amber-500 text-[9px]">
                                <AlertTriangle className="mr-1 h-2.5 w-2.5" /> Duplicate
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-500/15 text-emerald-500 text-[9px]">
                                <Plus className="mr-1 h-2.5 w-2.5" /> New
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Import Actions */}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">
                    {selectedRows.size} of {urlResults.length} teams selected for import
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs" data-testid="button-export-selected">
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Export Selected
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90 text-xs"
                      disabled={selectedRows.size === 0}
                      data-testid="button-import-selected"
                    >
                      <Database className="mr-1.5 h-3.5 w-3.5" /> Import {selectedRows.size} Teams
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CSV Upload */}
        <TabsContent value="csv" className="space-y-4">
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Upload CSV File</CardTitle>
              <p className="text-xs text-muted-foreground">Upload a CSV of team contacts. Press Box will clean, deduplicate, and prepare it for import.</p>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border-2 border-dashed border-card-border p-8 text-center" data-testid="dropzone-csv">
                <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Drop your CSV file here</p>
                <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
                <Button variant="outline" size="sm" className="mt-4 text-xs" data-testid="button-browse-csv">
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Choose File
                </Button>
              </div>

              <div className="mt-4 rounded-lg border border-card-border bg-muted/20 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Expected Columns</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {["Team Name", "Sport", "Age Group", "City", "State", "Coach Name", "Phone", "Email"].map((col) => (
                    <Badge key={col} variant="outline" className="text-[9px]">{col}</Badge>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">Missing columns will be left empty. Extra columns will be preserved in notes.</p>
              </div>
            </CardContent>
          </Card>

          {/* Import Status Preview */}
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Recent Import: Sandlot City & Evolve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-lg border border-card-border p-3">
                  <Users className="h-4 w-4 text-primary" />
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>656</p>
                  <p className="text-[10px] text-muted-foreground">Active Teams</p>
                </div>
                <div className="rounded-lg border border-card-border p-3">
                  <Mail className="h-4 w-4 text-primary" />
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>214</p>
                  <p className="text-[10px] text-muted-foreground">With Email</p>
                </div>
                <div className="rounded-lg border border-card-border p-3">
                  <Phone className="h-4 w-4 text-primary" />
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>452</p>
                  <p className="text-[10px] text-muted-foreground">With Phone</p>
                </div>
                <div className="rounded-lg border border-card-border p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="mt-1 text-2xl font-bold tabular-nums text-amber-500" style={{ fontFamily: "var(--font-display)" }}>49</p>
                  <p className="text-[10px] text-muted-foreground">Do Not Contact</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="text-xs" data-testid="button-download-sql">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download SQL Import
                </Button>
                <Button variant="outline" size="sm" className="text-xs" data-testid="button-download-csv">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download Clean CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Import */}
        <TabsContent value="database" className="space-y-4">
          <Card className="border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Import from Player1 Database</CardTitle>
              <p className="text-xs text-muted-foreground">Pull teams directly from your Player1 Supabase project into Press Box marketing audience.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-card-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Supabase Connected</p>
                      <p className="text-[10px] text-muted-foreground">Player1 database is accessible</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/15 text-emerald-500 text-[9px]">Connected</Badge>
                </div>

                <div className="rounded-lg border border-card-border p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Available Data Sources</p>
                  <div className="mt-2 space-y-2">
                    {[
                      { table: "press_teams", label: "Marketing Contacts", count: "656 teams", status: "ready" },
                      { table: "events", label: "Tournaments", count: "4 events", status: "ready" },
                      { table: "registrations", label: "Team Registrations", count: "73 registrations", status: "ready" },
                      { table: "team_staff", label: "Team Staff", count: "58 staff", status: "ready" },
                      { table: "profiles", label: "User Profiles", count: "12 directors", status: "ready" },
                    ].map((src) => (
                      <div key={src.table} className="flex items-center justify-between rounded-md border border-card-border/50 p-2">
                        <div className="flex items-center gap-2">
                          <Database className="h-3.5 w-3.5 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium text-foreground">{src.label}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{src.table}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{src.count}</span>
                          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-500 text-[9px]">
                            <CheckCircle2 className="mr-1 h-2.5 w-2.5" /> Ready
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-primary text-primary-foreground glow-primary hover:bg-primary/90" data-testid="button-sync-database">
                  <Database className="mr-2 h-4 w-4" /> Sync All Data Sources
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
