"use client";

import { BookingsSection } from "@/components/dashboard/sections";
import { useDashboardStore } from "@/components/dashboard/StoreProvider";

export default function BookingsPage() {
  const { store } = useDashboardStore();
  return <BookingsSection store={store} />;
}
