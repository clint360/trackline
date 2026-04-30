"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, TicketIcon, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn, formatFCFA } from "@/lib/utils";
import { useDashboardStore } from "./StoreProvider";

const READ_KEY = "trackline:notifications:lastRead";

interface Notification {
  id: string;
  title: string;
  body: string;
  amount?: number;
  ts: string;
  iconKind: "booking" | "alert";
}

function fmtTs(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h ago`;
  return d.toLocaleDateString();
}

export function NotificationsBell() {
  const { store } = useDashboardStore();
  const [open, setOpen] = useState(false);
  const [lastRead, setLastRead] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Hydrate last-read timestamp
  useEffect(() => {
    const v = Number(localStorage.getItem(READ_KEY) ?? "0");
    setLastRead(v);
  }, []);

  // Build notifications from the store. Today: each non-cancelled booking
  // becomes a "ticket booked" notification. We can extend later with payment
  // failures, low-availability alerts, etc.
  const notifs = useMemo<Notification[]>(() => {
    const list: Notification[] = [];
    for (const b of store.bookings) {
      if (b.status === "cancelled") continue;
      list.push({
        id: b.consignment,
        title: `New booking · ${b.consignment}`,
        body: `${b.passenger.fullName} paid ${b.paymentMethod === "MTN" ? "MTN MoMo" : "Orange Money"} for seat ${b.seat}`,
        amount: b.amount,
        ts: b.createdAt,
        iconKind: "booking",
      });
    }
    // Newest first, cap at 12
    return list
      .sort((a, b) => (a.ts < b.ts ? 1 : -1))
      .slice(0, 12);
  }, [store.bookings]);

  const unreadCount = useMemo(
    () =>
      notifs.filter(
        (n) => new Date(n.ts).getTime() > lastRead
      ).length,
    [notifs, lastRead]
  );

  const markAllRead = () => {
    const now = Date.now();
    localStorage.setItem(READ_KEY, String(now));
    setLastRead(now);
  };

  // Close on outside click + escape
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

  // Mark as read when the panel opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      const id = setTimeout(() => markAllRead(), 800);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className={cn(
          "relative p-2 rounded-xl text-ink-600 hover:bg-ink-100",
          open && "bg-ink-100 text-ink-900"
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-[min(92vw,22rem)] origin-top-right rounded-2xl border border-ink-100 bg-white shadow-card z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Notifications
                </p>
                <p className="text-[11px] text-ink-500">
                  {unreadCount > 0
                    ? `${unreadCount} unread · live from bookings`
                    : "All caught up"}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {notifs.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="h-10 w-10 mx-auto rounded-full bg-ink-50 text-ink-300 flex items-center justify-center">
                    <Bell className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-ink-600 font-medium mt-3">
                    Nothing here yet
                  </p>
                  <p className="text-[11px] text-ink-400 mt-1 px-6">
                    New bookings and payment events will appear here in real time.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {notifs.map((n) => {
                    const isUnread = new Date(n.ts).getTime() > lastRead;
                    return (
                      <li
                        key={n.id}
                        className={cn(
                          "px-4 py-3 flex items-start gap-3 transition-colors",
                          isUnread && "bg-brand-50/40"
                        )}
                      >
                        <div
                          className={cn(
                            "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                            n.iconKind === "booking"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          )}
                        >
                          {n.iconKind === "booking" ? (
                            <TicketIcon className="h-4 w-4" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-ink-900 truncate">
                              {n.title}
                            </p>
                            {isUnread && (
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-ink-600 mt-0.5 leading-relaxed">
                            {n.body}
                          </p>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-ink-400">
                              {fmtTs(n.ts)}
                            </span>
                            {typeof n.amount === "number" && (
                              <span className="text-[11px] font-mono font-bold text-ink-800">
                                {formatFCFA(n.amount)}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {notifs.length > 0 && (
              <div className="px-4 py-2.5 border-t border-ink-100 bg-ink-50/40 flex items-center justify-between">
                <button
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  className="text-[11px] font-semibold text-brand-700 disabled:text-ink-400 hover:text-brand-800 inline-flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Mark all as read
                </button>
                <span className="text-[10px] text-ink-400">
                  {notifs.length} recent
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
