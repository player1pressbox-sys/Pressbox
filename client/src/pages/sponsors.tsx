import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sponsors } from "../../../shared/mockData";
import {
  Trophy,
  DollarSign,
  TrendingUp,
  QrCode,
  Gift,
  Users,
  Plus,
  Award,
  Star,
} from "lucide-react";

const tierColors: Record<string, string> = {
  platinum: "border-cyan-500/30 bg-cyan-500/10 text-cyan-500",
  gold: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  silver: "border-slate-400/30 bg-slate-400/10 text-slate-400",
  bronze: "border-orange-700/30 bg-orange-700/10 text-orange-600",
};

const tierIcons: Record<string, any> = {
  platinum: Award,
  gold: Star,
  silver: Trophy,
  bronze: Trophy,
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-500",
  pending_renewal: "bg-amber-500/15 text-amber-500",
  lapsed: "bg-red-500/15 text-red-500",
};

export default function Sponsors() {
  const totalInvestment = sponsors.reduce((s, sp) => s + sp.investment, 0);
  const totalScans = sponsors.reduce((s, sp) => s + sp.qrScans, 0);
  const totalRedemptions = sponsors.reduce((s, sp) => s + sp.offerRedemptions, 0);
  const totalLeads = sponsors.reduce((s, sp) => s + sp.leads, 0);
  const avgRoi = (sponsors.reduce((s, sp) => s + sp.roi, 0) / sponsors.length).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Sponsor Press Room</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage sponsor inventory, track activations, and prove ROI</p>
        </div>
        <Button className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90" data-testid="button-add-sponsor">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Sponsor
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="h-3.5 w-3.5" /> Total Investment</div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>${(totalInvestment / 1000).toFixed(0)}k</p>
          </CardContent>
        </Card>
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><QrCode className="h-3.5 w-3.5" /> QR Scans</div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>{totalScans.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Gift className="h-3.5 w-3.5" /> Offer Redemptions</div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>{totalRedemptions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> Leads Generated</div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-primary" style={{ fontFamily: "var(--font-display)" }}>{totalLeads}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" /> Avg ROI</div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-primary" style={{ fontFamily: "var(--font-display)" }}>{avgRoi}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Sponsor Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sponsors.map((sponsor) => {
          const TierIcon = tierIcons[sponsor.tier];
          return (
            <Card key={sponsor.id} className="border-card-border" data-testid={`card-sponsor-${sponsor.id}`}>
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold", tierColors[sponsor.tier])}>
                      {sponsor.logo}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{sponsor.name}</h3>
                      <p className="text-[10px] text-muted-foreground">{sponsor.category}</p>
                      <Badge variant="outline" className={cn("mt-1 text-[9px] uppercase", tierColors[sponsor.tier])}>
                        <TierIcon className="mr-1 h-2.5 w-2.5" /> {sponsor.tier}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", statusColors[sponsor.status])}>
                    {sponsor.status.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Stats Grid */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-card-border bg-muted/30 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Investment</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">${(sponsor.investment / 1000).toFixed(1)}k</p>
                  </div>
                  <div className="rounded-lg border border-card-border bg-muted/30 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Events</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">{sponsor.events}</p>
                  </div>
                  <div className={cn("rounded-lg border px-3 py-2", sponsor.roi >= 200 ? "border-primary/20 bg-primary/5" : "border-card-border bg-muted/30")}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ROI</p>
                    <p className={cn("text-sm font-bold tabular-nums", sponsor.roi >= 200 ? "text-primary" : "text-foreground")}>{sponsor.roi}%</p>
                  </div>
                </div>

                {/* Engagement Metrics */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><QrCode className="h-3 w-3" /> QR Scans</span>
                    <span className="font-semibold tabular-nums text-foreground">{sponsor.qrScans.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Gift className="h-3 w-3" /> Offer Redemptions</span>
                    <span className="font-semibold tabular-nums text-foreground">{sponsor.offerRedemptions}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-3 w-3" /> Leads Generated</span>
                    <span className="font-semibold tabular-nums text-primary">{sponsor.leads}</span>
                  </div>
                </div>

                {/* Renewal */}
                <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-[10px] text-muted-foreground">Renewal Date</span>
                  <span className={cn(
                    "text-xs font-semibold",
                    sponsor.status === 'pending_renewal' ? "text-amber-500" : sponsor.status === 'lapsed' ? "text-red-500" : "text-foreground"
                  )}>
                    {sponsor.renewalDate}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" data-testid={`button-sponsor-report-${sponsor.id}`}>
                    ROI Report
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1 text-xs" data-testid={`button-sponsor-manage-${sponsor.id}`}>
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sponsor Inventory Overview */}
      <Card className="border-card-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Sponsor Inventory Available</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "Field Banners", available: 8, total: 12, price: "$500" },
              { name: "Program Ads", available: 5, total: 10, price: "$250" },
              { name: "Jersey Logos", available: 3, total: 6, price: "$1,000" },
              { name: "Social Media", available: 4, total: 8, price: "$300" },
            ].map((item) => (
              <div key={item.name} className="rounded-lg border border-card-border p-3" data-testid={`card-inventory-${item.name.replace(/\s/g, '-')}`}>
                <p className="text-xs font-semibold text-foreground">{item.name}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{item.available} of {item.total} available</p>
                <p className="mt-1 text-sm font-bold tabular-nums text-primary">{item.price}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
