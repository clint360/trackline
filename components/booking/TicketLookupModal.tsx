"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Search, Ticket as TicketIcon, X } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { useI18n } from "@/lib/i18n";

export function TicketLookupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Close on escape + lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const c = code.trim().toUpperCase();
    if (!c) {
      setError(t("ticket_lookup_required"));
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(c)}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError(t("ticket_not_found"));
        } else {
          const j = await res.json().catch(() => ({}));
          setError(j?.error ?? "Lookup failed");
        }
        setLoading(false);
        return;
      }
      // Success — go to the public ticket page so the user can save / share / scan
      window.location.href = `/ticket/${encodeURIComponent(c)}`;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="card pointer-events-auto w-full max-w-md p-6 sm:p-7 relative"
            >
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="h-11 w-11 rounded-2xl bg-brand-gradient text-white flex items-center justify-center shadow-glow">
                <TicketIcon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-ink-900 mt-4">
                {t("check_ticket_title")}
              </h2>
              <p className="text-sm text-ink-500 mt-1">
                {t("check_ticket_body")}
              </p>

              <form onSubmit={submit} className="mt-5 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
                  <Input
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="TRP-YDE-DLA-1A2B3C4D"
                    className="pl-10 font-mono tracking-widest uppercase"
                    invalid={!!error}
                  />
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
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("checking")}
                    </>
                  ) : (
                    <>
                      {t("find_ticket")}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 text-[11px] text-ink-400 text-center">
                {t("check_ticket_hint")}
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
