import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  ArrowRight,
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  Shield,
  Zap,
  Phone,
  ChevronRight,
} from "lucide-react";

const API_BASE = typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "";

export default function Home() {
  const { isAuthenticated, director } = useAuth();
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/admin-exists`)
      .then(r => r.json())
      .then(d => setAdminExists(d.adminExists))
      .catch(() => setAdminExists(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-card-border">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <div className="text-sm font-bold text-foreground leading-none" style={{ fontFamily: "var(--font-display)" }}>PLAYER1</div>
            <div className="text-[10px] text-muted-foreground leading-none mt-0.5">PRESS BOX</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button
              onClick={() => window.location.hash = "#/dashboard"}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
            >
              Go to Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => window.location.hash = "#/login"}
              >
                Login
              </Button>
              <Button
                onClick={() => window.location.hash = "#/signup"}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
              >
                Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 md:px-6 pt-12 md:pt-20 pb-12 md:pb-16">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Big logo */}
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Logo size={40} />
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>PLAYER1</div>
                <div className="text-lg text-primary font-semibold" style={{ fontFamily: "var(--font-display)" }}>PRESS BOX</div>
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Market Tournaments.<br />
            <span className="text-primary">Fill Divisions.</span>
          </h1>

          <p className="mt-4 md:mt-6 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            The all-in-one marketing platform for tournament directors. SMS blasts, email campaigns,
            social media scheduling, and a 656-team marketing database — all in one dashboard.
          </p>

          <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            {!isAuthenticated && (
              <>
                {adminExists === false && (
                  <Button
                    onClick={() => window.location.hash = "#/admin-setup"}
                    className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90 text-sm px-6"
                  >
                    <Shield className="mr-2 h-4 w-4" /> Create Admin Account
                  </Button>
                )}
                <Button
                  onClick={() => window.location.hash = "#/signup"}
                  variant="outline"
                  className="text-sm px-6"
                >
                  Director Sign Up <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
            {isAuthenticated && (
              <Button
                onClick={() => window.location.hash = "#/dashboard"}
                className="bg-primary text-primary-foreground glow-primary hover:bg-primary/90 text-sm px-6"
              >
                <TrendingUp className="mr-2 h-4 w-4" /> Go to Dashboard
              </Button>
            )}
          </div>

          {director && (
            <p className="mt-4 text-xs text-muted-foreground">
              Signed in as {director.name} ({director.role})
            </p>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon={<MessageSquare className="h-5 w-5 text-primary" />}
              title="SMS Blasts"
              desc="Send bulk SMS to hundreds of teams via Quo integration. Real-time delivery tracking."
            />
            <FeatureCard
              icon={<Users className="h-5 w-5 text-primary" />}
              title="656-Team Database"
              desc="Pre-loaded with 452 teams with phone numbers and 214 with emails. Filter by sport, state, age."
            />
            <FeatureCard
              icon={<Calendar className="h-5 w-5 text-primary" />}
              title="27 Live Events"
              desc="Real tournament data from Player1. Track registrations, revenue, and fill rates."
            />
            <FeatureCard
              icon={<Zap className="h-5 w-5 text-primary" />}
              title="Campaign Studio"
              desc="AI-powered campaign builder with email, SMS, and social templates. Schedule and track."
            />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="px-4 md:px-6 py-6 md:py-8 border-t border-card-border">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <Stat value="656" label="Teams in DB" />
            <Stat value="27" label="Live Events" />
            <Stat value="3" label="Quo Numbers" />
            <Stat value="452" label="SMS Ready" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 md:px-6 py-6 md:py-8 border-t border-card-border">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="text-xs text-muted-foreground">Player1 Press Box — Tournament Marketing Platform</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>Powered by Quo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card/30 p-5 transition-colors hover:border-primary/30 hover:bg-primary/5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-primary tabular-nums" style={{ fontFamily: "var(--font-display)" }}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

// SVG Logo — lightning bolt in a rounded square
function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Player1 Press Box logo">
      <rect width="48" height="48" rx="12" fill="currentColor" className="text-primary" />
      <path
        d="M26 10L14 28h8l-4 10 14-20h-8l2-8z"
        fill="white"
        stroke="white"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
