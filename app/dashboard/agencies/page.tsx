"use client";

import { AgenciesSection } from "@/components/dashboard/sections";
import { useDashboardStore } from "@/components/dashboard/StoreProvider";

export default function AgenciesPage() {
  const { store, persist } = useDashboardStore();
  return <AgenciesSection store={store} persist={persist} />;
}
