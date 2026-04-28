"use client";

import { SchedulesSection } from "@/components/dashboard/sections";
import { useDashboardStore } from "@/components/dashboard/StoreProvider";

export default function SchedulesPage() {
  const { store, persist } = useDashboardStore();
  return <SchedulesSection store={store} persist={persist} />;
}
