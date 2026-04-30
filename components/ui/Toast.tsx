"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastCtx {
  show: (m: string, k?: ToastKind) => void;
  success: (m: string) => void;
  error: (m: string) => void;
  info: (m: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((p) => p.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = Math.random().toString(36).slice(2);
      setItems((p) => [...p, { id, kind, message }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove]
  );

  const value = useMemo<ToastCtx>(
    () => ({
      show,
      success: (m) => show(m, "success"),
      error: (m) => show(m, "error"),
      info: (m) => show(m, "info"),
    }),
    [show]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed top-14 right-4 z-[100] flex flex-col gap-1.5 pointer-events-none">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "pointer-events-auto flex items-start gap-2 min-w-[220px] max-w-[320px] rounded-xl border px-3 py-2 shadow-card glass",
                t.kind === "success" && "border-emerald-200",
                t.kind === "error" && "border-rose-200",
                t.kind === "info" && "border-ink-200"
              )}
            >
              <div className="mt-0.5">
                {t.kind === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                {t.kind === "error" && (
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                )}
                {t.kind === "info" && (
                  <Info className="h-4 w-4 text-brand-500" />
                )}
              </div>
              <p className="text-sm text-ink-800 flex-1">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="text-ink-400 hover:text-ink-700"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
