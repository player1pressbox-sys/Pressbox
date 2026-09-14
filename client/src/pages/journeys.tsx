import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { journeys } from "../../../shared/mockData";
import {
  Workflow,
  Mail,
  MessageSquare,
  Share2,
  Clock,
  Users,
  Target,
  TrendingUp,
  Play,
  Pause,
  Plus,
  ChevronRight,
} from "lucide-react";

const typeColors: Record<string, string> = {
  abandoned_registration: "border-red-500/20 bg-red-500/10 text-red-500",
  past_attendee_return: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
  waitlist_fill: "border-amber-500/20 bg-amber-500/10 text-amber-500",
  post_event_retention: "border-blue-500/20 bg-blue-500/10 text-blue-500",
  sponsor_activation: "border-purple-500/20 bg-purple-500/10 text-purple-500",
};

const typeLabels: Record<string, string> = {
  abandoned_registration: "Abandoned Registration",
  past_attendee_return: "Past Attendee Return",
  waitlist_fill: "Waitlist Fill",
  post_event_retention: "Post-Event Retention",
  sponsor_activation: "Sponsor Activation",
};

const channelIcons: Record<string, any> = {
  email: Mail,
  sms: MessageSquare,
  social: Share2,
  wait: Clock,
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-500",
  paused: "bg-amber-500/15 text-amber-500",
  draft: "bg-muted text-muted-foreground",
};

export default function Journeys() {
  const totalEnrolled = journeys.reduce((s, j) => s + j.enrolled, 0);
  const totalConverted = journeys.reduce((s, j) => s + j.converted, 0);
  const avgConversion = (totalConverted / totalEnrolled * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Automation Journeys</h2>
          <p className="mt-1 text-sm text-muted-foreground">Event-driven campaign sequences that run automatically</p>
        </div>
        <Button className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90" data-testid="button-new-journey">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New Journey
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Workflow className="h-3.5 w-3.5" /> Active Journeys</div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>{journeys.filter(j => j.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" /> Total Enrolled</div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>{totalEnrolled}</p>
          </CardContent>
        </Card>
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Target className="h-3.5 w-3.5" /> Total Conversions</div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-primary" style={{ fontFamily: "var(--font-display)" }}>{totalConverted}</p>
          </CardContent>
        </Card>
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" /> Avg Conversion</div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground" style={{ fontFamily: "var(--font-display)" }}>{avgConversion}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Journey Cards */}
      <div className="space-y-4">
        {journeys.map((journey) => (
          <Card key={journey.id} className="border-card-border" data-testid={`card-journey-${journey.id}`}>
            <CardContent className="p-5">
              {/* Journey Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", typeColors[journey.type])}>
                    <Workflow className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{journey.name}</h3>
                      <Badge variant="outline" className={cn("text-[10px]", statusColors[journey.status])}>{journey.status}</Badge>
                    </div>
                    <Badge variant="outline" className={cn("mt-1 text-[10px]", typeColors[journey.type])}>{typeLabels[journey.type]}</Badge>
                    <p className="mt-1.5 text-xs text-muted-foreground">{journey.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="h-8 text-xs" data-testid={`button-toggle-journey-${journey.id}`}>
                    {journey.status === 'active' ? <><Pause className="mr-1 h-3 w-3" /> Pause</> : <><Play className="mr-1 h-3 w-3" /> Activate</>}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" data-testid={`button-edit-journey-${journey.id}`}>
                    Edit <ChevronRight className="ml-0.5 h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Journey Stats */}
              <div className="mt-4 grid grid-cols-4 gap-3">
                <div className="rounded-lg border border-card-border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Enrolled</p>
                  <p className="text-sm font-bold tabular-nums text-foreground">{journey.enrolled}</p>
                </div>
                <div className="rounded-lg border border-card-border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</p>
                  <p className="text-sm font-bold tabular-nums text-foreground">{journey.completed}</p>
                </div>
                <div className="rounded-lg border border-card-border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Converted</p>
                  <p className="text-sm font-bold tabular-nums text-primary">{journey.converted}</p>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-primary">Conversion Rate</p>
                  <p className="text-sm font-bold tabular-nums text-primary">{journey.conversionRate.toFixed(1)}%</p>
                </div>
              </div>

              {/* Journey Steps Flow */}
              <div className="mt-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sequence Flow</p>
                <div className="flex flex-wrap items-start gap-2">
                  {journey.steps.map((step, i) => {
                    const Icon = channelIcons[step.channel] || Mail;
                    return (
                      <div key={step.id} className="flex items-center gap-2">
                        <div className={cn(
                          "rounded-lg border p-2.5 min-w-[140px]",
                          step.channel === 'wait' ? "border-card-border bg-muted/20" : "border-card-border"
                        )} data-testid={`card-step-${step.id}`}>
                          <div className="flex items-center gap-1.5">
                            <Icon className={cn("h-3 w-3", step.channel === 'email' ? "text-primary" : step.channel === 'sms' ? "text-accent" : step.channel === 'wait' ? "text-muted-foreground" : "text-blue-500")} />
                            <span className="text-[10px] font-semibold text-foreground">{step.name}</span>
                          </div>
                          <p className="mt-1 text-[9px] text-muted-foreground">{step.delay}</p>
                          {step.sent > 0 && (
                            <div className="mt-1.5 flex items-center gap-2 text-[9px] text-muted-foreground">
                              <span>Sent: <span className="font-semibold text-foreground">{step.sent}</span></span>
                              {step.opened > 0 && <span>Open: <span className="font-semibold text-foreground">{step.opened}</span></span>}
                            </div>
                          )}
                        </div>
                        {i < journey.steps.length - 1 && (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
