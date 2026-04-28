"use client";

import { Overview } from "@/components/dashboard/sections";
import { useDashboardStore } from "@/components/dashboard/StoreProvider";

export default function OverviewPage() {
  const { store } = useDashboardStore();
  return <Overview store={store} />;
}
