"use client";

import { TripsSection } from "@/components/dashboard/sections";
import { useDashboardStore } from "@/components/dashboard/StoreProvider";

export default function TripsPage() {
  const { store, persist } = useDashboardStore();
  return <TripsSection store={store} persist={persist} />;
}
