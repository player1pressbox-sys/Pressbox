import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      window.location.hash = "#/dashboard";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

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
              Director Login
            </CardTitle>
            <p className="text-xs text-muted-foreground">Sign in to your Press Box account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="director@example.com"
                  className="mt-1 text-xs"
                  required
                  data-testid="input-login-email"
                />
              </div>
              <div>
                <Label className="text-xs">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="mt-1 text-xs"
                  required
                  data-testid="input-login-password"
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
                data-testid="button-login-submit"
              >
                {loading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Signing in...</> : "Sign In"}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => window.location.hash = "#/signup"}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
