"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, MapPin } from "lucide-react";
import { CITIES } from "@/lib/mock-data";
import type { SearchedTrip, SeatClass } from "@/lib/types";
import type { RouteForm } from "@/lib/schemas";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/Skeleton";
import { TripCard } from "@/components/booking/TripCard";

export function TripStep({
  route,
  onBack,
  onSelect,
}: {
  route: RouteForm;
  onBack: () => void;
  onSelect: (t: SearchedTrip, k: SeatClass) => void;
}) {
  const { t } = useI18n();
  const [trips, setTrips] = useState<SearchedTrip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ id: string; klass: SeatClass } | null>(
    null
  );

  useEffect(() => {
    let cancel = false;
    (async () => {
      setTrips(null);
      setError(null);
      try {
        const u = new URL("/api/trips/search", window.location.origin);
        u.searchParams.set("fromCityId", route.fromCityId);
        u.searchParams.set("toCityId", route.toCityId);
        u.searchParams.set("date", route.date);
        const res = await fetch(u);
        const j = await res.json();
        if (!res.ok) throw new Error(j.error ?? "Failed");
        if (!cancel) setTrips(j.trips);
      } catch (e: any) {
        if (!cancel) setError(e.message);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [route]);

  const fromCity = CITIES.find((c) => c.id === route.fromCityId);
  const toCity = CITIES.find((c) => c.id === route.toCityId);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <button onClick={onBack} className="btn-ghost text-sm">
          <ChevronLeft className="h-4 w-4" /> {t("back")}
        </button>
        <div className="text-sm text-ink-600 font-medium flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-brand-500" />
          {fromCity?.name} → {toCity?.name} ·{" "}
          <span className="text-ink-500">{formatDate(route.date)}</span>
        </div>
      </div>

      {error && (
        <div className="card p-6 text-rose-600 text-sm">{error}</div>
      )}

      {!trips && !error && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card p-5 sm:p-6 flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-10 w-24 rounded-2xl" />
            </div>
          ))}
        </div>
      )}

      {trips && trips.length === 0 && (
        <div className="card p-8 text-center text-ink-500">{t("no_trips")}</div>
      )}

      {trips && trips.length > 0 && (
        <div className="space-y-3">
          {trips.map((t, i) => (
            <div key={t.id}>
              <TripCard
                trip={t}
                index={i}
                selectedKlass={picked?.id === t.id ? picked.klass : undefined}
                onSelect={(klass) => {
                  setPicked({ id: t.id, klass });
                  // Auto-advance after a short delay for delight
                  setTimeout(() => onSelect(t, klass), 250);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
