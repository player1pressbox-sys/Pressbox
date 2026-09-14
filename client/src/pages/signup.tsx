import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Loader2, AlertCircle, Check } from "lucide-react";

export default function Signup() {
  const { signup } = useAuth();
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
      await signup({ email, password, name, organizationName: orgName, phone });
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
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Account Created</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your director account has been created and is pending admin approval.
              You'll be able to log in once approved.
            </p>
            <Button
              onClick={() => window.location.hash = "#/login"}
              className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
            >
              Go to Login
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

        <Card className="border-card-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Director Sign Up
            </CardTitle>
            <p className="text-xs text-muted-foreground">Create your Press Box director account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs">Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Mike Reynolds"
                  className="mt-1 text-xs"
                  required
                  data-testid="input-signup-name"
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="director@example.com"
                  className="mt-1 text-xs"
                  required
                  data-testid="input-signup-email"
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
                  data-testid="input-signup-password"
                />
              </div>
              <div>
                <Label className="text-xs">Organization (optional)</Label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Sandlot City Tournaments"
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
                data-testid="button-signup-submit"
              >
                {loading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Creating account...</> : "Create Account"}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => window.location.hash = "#/login"}
                className="text-primary hover:underline font-medium"
              >
                Login
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
