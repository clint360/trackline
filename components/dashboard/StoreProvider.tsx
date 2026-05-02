"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getSupabase, SUPABASE_LIVE } from "@/lib/supabase/client";
import {
  agencyToRow,
  cityToRow,
  routeToRow,
  scheduleToRow,
  templateToRow,
  tripToRow,
} from "@/lib/supabase/mappers";
import type { Store } from "@/lib/store";

interface DashboardStoreContext {
  store: Store;
  persist: (next: Store) => Promise<void> | void;
  reload: () => Promise<void>;
}

const Ctx = createContext<DashboardStoreContext | null>(null);

const EMPTY_STORE: Store = {
  cities: [],
  agencies: [],
  busTemplates: [],
  routes: [],
  schedules: [],
  trips: [],
  bookings: [],
  citiesArchived: [],
};

const adminFetch = async (path: string, body: unknown) => {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(
      typeof j?.error === "string" ? j.error : `${path} failed`
    );
  }
  return res.json();
};

/** Diff two arrays of {id} objects; returns {added, removed, updated}. */
function diffById<T extends { id: string }>(prev: T[], next: T[]) {
  const prevById = new Map(prev.map((x) => [x.id, x]));
  const nextById = new Map(next.map((x) => [x.id, x]));
  const added = next.filter((x) => !prevById.has(x.id));
  const removed = prev.filter((x) => !nextById.has(x.id));
  const updated = next.filter((x) => {
    const p = prevById.get(x.id);
    return p && JSON.stringify(p) !== JSON.stringify(x);
  });
  return { added, removed, updated };
}

export function DashboardStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);
  const storeRef = useRef<Store | null>(null);
  storeRef.current = store;

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      setError(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      setStore(EMPTY_STORE);
      return;
    }
    try {
      const res = await fetch("/api/admin/catalog");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to load catalog");
      }
      const data = await res.json();
      setStore({ ...EMPTY_STORE, ...data });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load workspace");
      setStore(EMPTY_STORE);
    }
  }, []);

  // Initial load + first-run seed: if Supabase is connected and the catalog
  // is empty (fresh project) we trigger the seed endpoint once and reload.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
      const cur = storeRef.current;
      if (
        cur &&
        cur.cities.length === 0 &&
        cur.agencies.length === 0 &&
        cur.routes.length === 0 &&
        SUPABASE_LIVE
      ) {
        try {
          const seedKey = "trackline:seeded:v1";
          if (typeof window !== "undefined" && !localStorage.getItem(seedKey)) {
            await fetch("/api/admin/seed", { method: "POST" });
            localStorage.setItem(seedKey, "1");
            await load();
          }
        } catch {
          /* non-fatal — operator can press the seed button */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  // Realtime: re-fetch on any booking insert / trip update so the dashboard
  // stays live as new payments come in.
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const channel = sb
      .channel("trackline-dash")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trips" },
        () => load()
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [load]);

  const persist: DashboardStoreContext["persist"] = useCallback(
    async (next: Store) => {
      const prev = storeRef.current ?? EMPTY_STORE;
      // Optimistic update
      setStore(next);
      try {
        const ops: Promise<unknown>[] = [];

        const cityDiff = diffById(prev.cities, next.cities);
        for (const c of [...cityDiff.added, ...cityDiff.updated]) {
          ops.push(
            adminFetch("/api/admin/upsert", {
              table: "cities",
              row: cityToRow(c),
            }).then(() =>
              adminFetch("/api/admin/dropoffs", {
                cityId: c.id,
                dropOffs: c.dropOffs ?? [],
              })
            )
          );
        }
        for (const c of cityDiff.removed) {
          ops.push(
            adminFetch("/api/admin/delete", { table: "cities", id: c.id })
          );
        }

        const agencyDiff = diffById(prev.agencies, next.agencies);
        for (const a of [...agencyDiff.added, ...agencyDiff.updated]) {
          ops.push(
            adminFetch("/api/admin/upsert", {
              table: "agencies",
              row: agencyToRow(a),
            })
          );
        }
        for (const a of agencyDiff.removed) {
          ops.push(
            adminFetch("/api/admin/delete", { table: "agencies", id: a.id })
          );
        }

        const tplDiff = diffById(prev.busTemplates, next.busTemplates);
        for (const t of [...tplDiff.added, ...tplDiff.updated]) {
          ops.push(
            adminFetch("/api/admin/upsert", {
              table: "bus_templates",
              row: templateToRow(t),
            })
          );
        }
        for (const t of tplDiff.removed) {
          ops.push(
            adminFetch("/api/admin/delete", {
              table: "bus_templates",
              id: t.id,
            })
          );
        }

        const routeDiff = diffById(prev.routes, next.routes);
        for (const r of [...routeDiff.added, ...routeDiff.updated]) {
          ops.push(
            adminFetch("/api/admin/upsert", {
              table: "routes",
              row: routeToRow(r),
            })
          );
        }
        for (const r of routeDiff.removed) {
          ops.push(
            adminFetch("/api/admin/delete", { table: "routes", id: r.id })
          );
        }

        const schedDiff = diffById(prev.schedules, next.schedules);
        for (const s of [...schedDiff.added, ...schedDiff.updated]) {
          ops.push(
            adminFetch("/api/admin/upsert", {
              table: "schedules",
              row: scheduleToRow(s),
            })
          );
        }
        for (const s of schedDiff.removed) {
          ops.push(
            adminFetch("/api/admin/delete", { table: "schedules", id: s.id })
          );
        }

        const tripDiff = diffById(prev.trips, next.trips);
        for (const t of [...tripDiff.added, ...tripDiff.updated]) {
          ops.push(
            adminFetch("/api/admin/upsert", {
              table: "trips",
              row: tripToRow(t),
            })
          );
        }
        for (const t of tripDiff.removed) {
          ops.push(
            adminFetch("/api/admin/delete", { table: "trips", id: t.id })
          );
        }

        await Promise.all(ops);
        // Reload to get authoritative state (timestamps, etc.)
        load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
        // Roll back optimistic update by reloading from server
        load();
      }
    },
    [load]
  );

  if (!store) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm z-50">
        <div className="h-10 w-10 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
        <p className="text-ink-600 text-sm font-medium">Loading workspace…</p>
      </div>
    );
  }
  if (error && SUPABASE_LIVE === false) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-rose-600 text-sm px-6 text-center">
        {error}
      </div>
    );
  }

  return (
    <Ctx.Provider value={{ store, persist, reload: load }}>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 shadow-lg">
          {error}
        </div>
      )}
      {children}
    </Ctx.Provider>
  );
}

export function useDashboardStore(): DashboardStoreContext {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useDashboardStore must be used inside DashboardStoreProvider");
  return ctx;
}
