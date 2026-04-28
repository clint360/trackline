"use client";

import { TemplatesSection } from "@/components/dashboard/sections";
import { useDashboardStore } from "@/components/dashboard/StoreProvider";

export default function TemplatesPage() {
  const { store, persist } = useDashboardStore();
  return <TemplatesSection store={store} persist={persist} />;
}
