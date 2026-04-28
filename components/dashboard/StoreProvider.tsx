"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { loadStore, saveStore, type Store } from "@/lib/store";

interface DashboardStoreContext {
  store: Store;
  persist: (next: Store) => void;
}

const Ctx = createContext<DashboardStoreContext | null>(null);

export function DashboardStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    setStore(loadStore());
  }, []);

  if (!store) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-ink-500 text-sm">
        Loading workspace…
      </div>
    );
  }

  const persist = (next: Store) => {
    setStore(next);
    saveStore(next);
  };

  return <Ctx.Provider value={{ store, persist }}>{children}</Ctx.Provider>;
}

export function useDashboardStore() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useDashboardStore must be used inside DashboardStoreProvider");
  return ctx;
}
