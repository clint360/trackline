"use client";

import { RoutesSection } from "@/components/dashboard/sections";
import { useDashboardStore } from "@/components/dashboard/StoreProvider";

export default function RoutesPage() {
  const { store, persist } = useDashboardStore();
  return <RoutesSection store={store} persist={persist} />;
}
