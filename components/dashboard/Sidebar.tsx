"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Bus,
  Building2,
  CalendarRange,
  GitBranch,
  LayoutDashboard,
  MapPin,
  TicketIcon,
  X,
} from "lucide-react";

export type DashSection =
  | "overview"
  | "cities"
  | "agencies"
  | "templates"
  | "routes"
  | "schedules"
  | "trips";

interface Item {
  key: DashSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export const SIDEBAR_ITEMS: Item[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, href: "/dashboard/overview" },
  { key: "cities", label: "Cities", icon: MapPin, href: "/dashboard/cities" },
  { key: "agencies", label: "Agencies", icon: Building2, href: "/dashboard/agencies" },
  { key: "templates", label: "Bus Templates", icon: Bus, href: "/dashboard/templates" },
  { key: "routes", label: "Routes", icon: GitBranch, href: "/dashboard/routes" },
  { key: "schedules", label: "Schedules", icon: CalendarRange, href: "/dashboard/schedules" },
  { key: "trips", label: "Trips", icon: TicketIcon, href: "/dashboard/trips" },
];

export function sectionFromPathname(pathname: string | null): DashSection {
  if (!pathname) return "overview";
  const match = SIDEBAR_ITEMS.find((it) => pathname.startsWith(it.href));
  return match?.key ?? "overview";
}

function NavList() {
  const pathname = usePathname();
  const active = sectionFromPathname(pathname);

  return (
    <nav className="px-3 py-2 flex-1 overflow-y-auto scrollbar-thin">
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-ink-400">
        Workspace
      </p>
      {SIDEBAR_ITEMS.map((it) => {
        const Icon = it.icon;
        const isActive = active === it.key;
        return (
          <Link
            key={it.key}
            href={it.href}
            className={cn(
              "relative w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all",
              isActive
                ? "bg-brand-50 text-brand-700 font-semibold"
                : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="sidebar-active"
                className="absolute left-0 top-1/2 -mt-2.5 h-5 w-1 rounded-r-full bg-brand-500"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <Icon className="h-4 w-4 shrink-0" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent() {
  return (
    <>
      <div className="p-5 flex items-center gap-2.5 border-b border-ink-100">
        <div className="h-9 w-9 rounded-2xl bg-brand-gradient text-white flex items-center justify-center shadow-glow">
          <Bus className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-ink-900 leading-none">Trackline</h1>
          <p className="text-[11px] text-ink-500 mt-1">Operator Dashboard</p>
        </div>
      </div>

      <NavList />

      <div className="p-4 border-t border-ink-100 space-y-3">
        <div className="rounded-2xl border border-ink-100 bg-gradient-to-br from-brand-50 to-white p-3">
          <p className="text-xs font-semibold text-brand-800">Pro Tip</p>
          <p className="text-[11px] text-ink-600 mt-1 leading-relaxed">
            Lock seat layouts after first booking to prevent passenger conflicts.
          </p>
        </div>
        <Link
          href="/"
          className="block text-xs text-ink-500 hover:text-brand-700 px-1"
        >
          ← Back to Trackline
        </Link>
      </div>
    </>
  );
}

/* Desktop sidebar (>= lg) */
export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-ink-100 bg-white sticky top-0 h-screen">
      <SidebarContent />
    </aside>
  );
}

/* Mobile drawer (< lg) */
export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed left-0 top-0 h-full w-72 bg-white z-50 border-r border-ink-100 shadow-2xl flex flex-col lg:hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 z-10"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
