"use client";

import { Bell, LogOut, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  SIDEBAR_ITEMS,
  sectionFromPathname,
  type DashSection,
} from "./Sidebar";

const TITLES: Record<DashSection, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Network at a glance" },
  cities: { title: "Cities", subtitle: "Manage cities served" },
  agencies: { title: "Agencies", subtitle: "Travel agencies operating trips" },
  templates: { title: "Bus Templates", subtitle: "Design reusable seat layouts" },
  routes: { title: "Routes", subtitle: "City-to-city connections" },
  schedules: { title: "Schedules", subtitle: "Standard departure times" },
  trips: { title: "Trips", subtitle: "Published trips and pricing" },
};

export function TopBar({
  onMenu,
  onLogout,
}: {
  onMenu: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const section = sectionFromPathname(pathname);
  const meta = TITLES[section];
  const crumb = SIDEBAR_ITEMS.find((i) => i.key === section)?.label;

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenu}
          className="lg:hidden p-2 -ml-2 rounded-xl text-ink-700 hover:bg-ink-100"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Title + breadcrumb */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-ink-400 font-medium hidden sm:block">
            Dashboard / <span className="text-ink-700">{crumb}</span>
          </p>
          <h1 className="text-base sm:text-lg font-bold text-ink-900 leading-tight truncate">
            {meta.title}
          </h1>
        </div>

        {/* Search */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            placeholder="Search…"
            className="w-64 pl-9 pr-3 py-2 rounded-xl border border-ink-200 bg-white text-sm outline-none focus:border-brand-400 focus:shadow-ring transition"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center px-1.5 py-0.5 rounded-md border border-ink-200 bg-ink-50 text-[10px] font-mono text-ink-500">
            ⌘K
          </kbd>
        </div>

        {/* Bell */}
        <button
          className="relative p-2 rounded-xl text-ink-600 hover:bg-ink-100"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 sm:border-l sm:border-ink-100">
          <div className="h-8 w-8 rounded-full bg-brand-gradient text-white text-xs font-bold flex items-center justify-center shadow-soft">
            OP
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-xs font-semibold text-ink-900">Operator</p>
            <p className="text-[11px] text-ink-500">admin@trackline.cm</p>
          </div>
          <button
            onClick={onLogout}
            className="ml-1 p-2 rounded-xl text-ink-500 hover:text-rose-600 hover:bg-rose-50"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Subtitle row (optional, on lg) */}
      <div className="hidden lg:block px-4 sm:px-6 lg:px-8 pb-3 -mt-1 text-xs text-ink-500">
        {meta.subtitle}
      </div>
    </header>
  );
}
