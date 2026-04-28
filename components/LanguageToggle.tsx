"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Option {
  code: Lang;
  label: string;
  short: string;
  flag: string;
}

const OPTIONS: Option[] = [
  { code: "en", label: "English", short: "EN", flag: "🇬🇧" },
  { code: "fr", label: "Français", short: "FR", flag: "🇫🇷" },
];

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = OPTIONS.find((o) => o.code === lang) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white pl-2.5 pr-2 py-1.5 text-xs font-semibold text-ink-700 shadow-soft transition-all hover:border-brand-300 hover:bg-brand-50/40",
          open && "border-brand-300 bg-brand-50/40"
        )}
      >
        <Globe className="h-3.5 w-3.5 text-ink-400" />
        <span className="text-sm leading-none">{current.flag}</span>
        <span className="text-[11px] tracking-wider">{current.short}</span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-ink-500 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-44 origin-top-right rounded-2xl border border-ink-100 bg-white p-1.5 shadow-card z-50"
          >
            {OPTIONS.map((o) => {
              const active = o.code === lang;
              return (
                <li key={o.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      setLang(o.code);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-left transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700 font-semibold"
                        : "text-ink-700 hover:bg-ink-50"
                    )}
                  >
                    <span className="text-base leading-none">{o.flag}</span>
                    <span className="flex-1">{o.label}</span>
                    <span className="text-[10px] font-mono text-ink-400 tracking-wider">
                      {o.short}
                    </span>
                    {active && (
                      <Check className="h-3.5 w-3.5 text-brand-600" />
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
