import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Logo from "@/components/Logo";

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">((params.get("mode") as any) || "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Please confirm your email first. Check your inbox.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Welcome back.");
      navigate("/");
    }
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (name.trim().length < 2) return toast.error("Please enter your name.");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: name.trim() },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created. Please check your email to confirm.");
      setTab("signin");
    }
  };

  return (
    <section className="container max-w-md py-12 sm:py-20 px-4">
      <div className="flex justify-center mb-8">
        <Logo />
      </div>
      <Card className="p-6 sm:p-8 shadow-soft">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full mb-6">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={signIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="si-email">Email</Label>
                <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="si-password">Password</Label>
                <Input id="si-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="su-name">Name</Label>
                <Input id="su-name" required value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-email">Email</Label>
                <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-password">Password</Label>
                <Input id="su-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} />
                <p className="text-xs text-muted-foreground">At least 8 characters. You'll need to confirm your email.</p>
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Creating…" : "Create account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">← Back to parking</Link>
      </p>
    </section>
  );
};

export default Auth;
