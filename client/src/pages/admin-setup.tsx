import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Loader2, AlertCircle, Shield, Check } from "lucide-react";

export default function AdminSetup() {
  const { bootstrapAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await bootstrapAdmin({ email, password, name, organizationName: orgName, phone });
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 md:px-6 bg-background">
        <Card className="border-card-border max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-500/15 mb-4">
              <Check className="h-6 w-6 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Admin Account Created</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your admin account has been created successfully. You now have full access to all Press Box features.
            </p>
            <Button
              onClick={() => window.location.hash = "#/dashboard"}
              className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 md:px-6 py-12 bg-background">
      <div className="w-full max-w-md">
        <button
          onClick={() => window.location.hash = "#/"}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </button>

        <Card className="border-primary/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                Create Admin Account
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This creates the main admin account with full access. This option is only available before the first admin is created.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs">Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Chrispien Mancino"
                  className="mt-1 text-xs"
                  required
                  data-testid="input-admin-name"
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="mt-1 text-xs"
                  required
                  data-testid="input-admin-email"
                />
              </div>
              <div>
                <Label className="text-xs">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="mt-1 text-xs"
                  required
                  minLength={6}
                  data-testid="input-admin-password"
                />
              </div>
              <div>
                <Label className="text-xs">Organization (optional)</Label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Player1 Elite"
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Phone (optional)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="mt-1 text-xs"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground glow-primary hover:bg-primary/90 disabled:opacity-50 text-sm"
                data-testid="button-admin-submit"
              >
                {loading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Creating admin...</> : "Create Admin Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
