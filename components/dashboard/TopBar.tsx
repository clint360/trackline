"use client";

import { LogOut, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  SIDEBAR_ITEMS,
  sectionFromPathname,
  type DashSection,
} from "./Sidebar";
import { NotificationsBell } from "./NotificationsBell";

const TITLES: Record<DashSection, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Network at a glance" },
  cities: { title: "Cities", subtitle: "Manage cities served" },
  agencies: { title: "Agencies", subtitle: "Travel agencies operating trips" },
  templates: { title: "Bus Templates", subtitle: "Design reusable seat layouts" },
  routes: { title: "Routes", subtitle: "City-to-city connections" },
  schedules: { title: "Schedules", subtitle: "Standard departure times" },
  trips: { title: "Trips", subtitle: "Published trips and pricing" },
  bookings: { title: "Bookings", subtitle: "Tickets sold across the network" },
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
        </div>

        {/* Bell */}
        <NotificationsBell />

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
    </header>
  );
}
