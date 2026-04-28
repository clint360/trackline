"use client";

import { CitiesSection } from "@/components/dashboard/sections";
import { useDashboardStore } from "@/components/dashboard/StoreProvider";

export default function CitiesPage() {
  const { store, persist } = useDashboardStore();
  return <CitiesSection store={store} persist={persist} />;
}
