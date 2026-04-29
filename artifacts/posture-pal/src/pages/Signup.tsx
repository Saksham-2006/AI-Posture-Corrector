import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/AuthContext";
import { AuthLayout, BrandPanel } from "./auth/AuthLayout";

export default function Signup() {
  const { signup } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordOk = password.length >= 6;
  const matchOk = confirm.length > 0 && password === confirm;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!passwordOk) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!matchOk) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await signup({ name, email, password });
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout brand={<BrandPanel />}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-strong w-full rounded-3xl border border-card-border p-8 shadow-xl"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your posture over time and earn badges as you improve.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FieldWithIcon
            id="name"
            label="Name"
            value={name}
            onChange={setName}
            type="text"
            placeholder="Jamie Lee"
            icon={<User className="h-4 w-4 text-muted-foreground" />}
            autoComplete="name"
            testId="input-name"
          />

          <FieldWithIcon
            id="email"
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4 text-muted-foreground" />}
            autoComplete="email"
            testId="input-email"
          />

          <div>
            <Label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="pl-9 pr-10"
                autoComplete="new-password"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <Hint ok={passwordOk} good="Strong enough" bad="Needs at least 6 characters" />
            )}
          </div>

          <div>
            <Label htmlFor="confirm" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Confirm password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm"
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your password"
                className="pl-9"
                autoComplete="new-password"
                data-testid="input-confirm"
              />
            </div>
            {confirm.length > 0 && (
              <Hint ok={matchOk} good="Passwords match" bad="Passwords don't match" />
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-destructive/20">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full gap-2" size="lg" data-testid="button-signup">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have one?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center text-[11px] text-muted-foreground/80">
          We never store your video — accounts only save your name, email, and posture stats locally on this device.
        </p>
      </motion.div>
    </AuthLayout>
  );
}

function Hint({ ok, good, bad }: { ok: boolean; good: string; bad: string }) {
  return (
    <div className={`mt-1.5 flex items-center gap-1.5 text-[11px] ${ok ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {ok ? good : bad}
    </div>
  );
}

function FieldWithIcon({
  label,
  id,
  type,
  value,
  onChange,
  placeholder,
  icon,
  autoComplete,
  testId,
}: {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
  testId?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        {icon && <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={icon ? "pl-9" : ""}
          data-testid={testId}
        />
      </div>
    </div>
  );
}
