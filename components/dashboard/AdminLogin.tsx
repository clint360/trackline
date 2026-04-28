"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Bus,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

const ADMIN_EMAIL = "admin@trackline.cm";
const ADMIN_PASSWORD = "trackline2026";

export function AdminLogin({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 700));
    if (
      email.trim().toLowerCase() === ADMIN_EMAIL &&
      password === ADMIN_PASSWORD
    ) {
      toast.success("Welcome back, Operator");
      onAuthenticated();
    } else {
      setError("Invalid credentials. Check your email and password.");
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen relative flex items-center justify-center px-4 py-10 overflow-hidden"
    >
      {/* Background ornaments */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-ink-50" />
      <div
        className="absolute inset-0 -z-10 bg-grid-soft opacity-40"
        style={{ backgroundSize: "32px 32px" }}
      />
      <div className="absolute -top-32 -right-32 -z-10 h-80 w-80 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 -z-10 h-80 w-80 rounded-full bg-brand-100/60 blur-3xl" />

      <motion.form
        onSubmit={submit}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
        autoComplete="on"
      >
        <div className="card overflow-hidden shadow-card">
          {/* Header */}
          <div className="px-7 pt-7 pb-6 border-b border-ink-100">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-brand-gradient text-white flex items-center justify-center shadow-glow">
                <Bus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
                  Trackline
                </p>
                <h1 className="text-lg font-bold text-ink-900 leading-tight">
                  Operator Console
                </h1>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-ink-900 mt-6 leading-tight">
              Sign in to your dashboard
            </h2>
            <p className="text-sm text-ink-500 mt-1">
              Manage cities, routes, trips and bookings from one place.
            </p>
          </div>

          {/* Body */}
          <div className="px-7 py-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-ink-700 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@trackline.cm"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-ink-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-[11px] text-ink-500 hover:text-brand-600"
                  onClick={() => toast.info("Contact your admin to reset the password.")}
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="input pl-10 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 flex items-center gap-1.5">
                <span className="inline-block h-1 w-1 rounded-full bg-rose-500" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 group"
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && (
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>

            <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2.5 text-[11px] text-ink-700 flex items-start gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600 mt-0.5 shrink-0" />
              <div className="leading-relaxed">
                <span className="font-semibold text-brand-800">Demo credentials:</span>{" "}
                <span className="font-mono">admin@trackline.cm</span> /{" "}
                <span className="font-mono">trackline2026</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-4 border-t border-ink-100 bg-ink-50/40 flex items-center justify-between text-[11px] text-ink-500">
            <span>© Trackline {new Date().getFullYear()}</span>
            <Link href="/" className="hover:text-brand-600">
              ← Back to site
            </Link>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}
