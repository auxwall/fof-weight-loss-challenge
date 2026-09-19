"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, User, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";

function LoginForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "expired") {
      setError("Your session has expired or the token was invalid. Please sign in again.");
    } else if (errorParam === "unauthorized") {
      setError("Unauthorized. Admin privileges required for that section.");
    } else if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      const destination =
        data.user?.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/staff/dashboard";

      window.location.href = destination;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="gym-card rounded-2xl p-6 sm:p-7 shadow-2xl border-surface-border">
      <div className="mb-6">
        <h1 className="text-2xl font-black uppercase text-
        ">STAFF PORTAL</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Log in to scan participant passes and record Day-1 & Final weigh-ins.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/50 border border-gymRed/40 text-red-200 text-xs flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-gymRed shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Staff Username
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. staff.barsha"
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gymRed focus:ring-1 focus:ring-gymRed transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gymRed focus:ring-1 focus:ring-gymRed transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <div className="h-[100dvh] min-h-[100dvh] bg-background flex flex-col justify-between overflow-hidden">

      <main className="max-w-md w-full mx-auto py-2 sm:py-8 px-4 sm:px-6 flex-1 flex flex-col justify-center min-h-0">
        <header className="w-full pt-2 pb-0 sm:pt-8 sm:pb-4 flex items-center justify-center px-4 bg-transparent border-0">
          <Logo size="xl" href="/" />
        </header>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>

      <footer className="text-center text-[11px] text-zinc-500 py-2 sm:py-6 shrink-0">
        Authorized gym personnel & administrative access only.
      </footer>
    </div>
  );
}
