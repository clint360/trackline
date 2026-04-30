"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { listSeatLabels } from "@/lib/mock-data";
import type { SearchedTrip, SeatClass } from "@/lib/types";
import { formatDate, formatFCFA, formatTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { SeatMap } from "@/components/booking/SeatMap";
import { Row } from "@/components/booking/shared";

export function SeatStep({
  trip,
  seatClass,
  initialSeat,
  onBack,
  onSelect,
}: {
  trip: SearchedTrip;
  seatClass: SeatClass;
  initialSeat?: string;
  onBack: () => void;
  onSelect: (seat: string) => void;
}) {
  const { t } = useI18n();
  const [seat, setSeat] = useState<string | null>(initialSeat ?? null);
  const total = useMemo(() => listSeatLabels(trip.busTemplate.layout).length, [trip]);
  const seatsLeft = total - trip.takenSeats.length;
  const price = seatClass === "VIP" ? trip.priceVip : trip.priceRegular;
  const dropOffLabel = trip.dropOff?.name ?? `${trip.toCity.name} — ${t("city_center")}`;

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
      <div>
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="btn-ghost text-sm">
            <ChevronLeft className="h-4 w-4" /> {t("back")}
          </button>
          <p className="text-sm text-ink-500">
            {seatsLeft}/{total} {t("seats_available")}
          </p>
        </div>

        <SeatMap
          layout={trip.busTemplate.layout}
          taken={trip.takenSeats}
          selected={seat}
          onSelect={(s) => setSeat(s)}
          vip={seatClass === "VIP"}
        />
      </div>

      {/* Summary sidebar */}
      <aside className="card p-5 sm:p-6 lg:sticky lg:top-4">
        <h3 className="font-semibold text-ink-900">{t("trip_summary")}</h3>
        <div className="mt-4 space-y-3 text-sm">
          <Row label={t("agency")} value={trip.agency.name} />
          <Row label={t("route")} value={`${trip.fromCity.code} → ${trip.toCity.code}`} />
          <Row label={t("drop_off")} value={dropOffLabel} />
          <Row label={t("date_label")} value={formatDate(trip.date)} />
          <Row label={t("departure")} value={formatTime(trip.time)} />
          <Row label={t("class")} value={seatClass} />
          <Row label={t("seat_label")} value={seat ?? "—"} highlight={!!seat} />
        </div>

        <div className="mt-5 pt-5 border-t border-ink-100 flex items-center justify-between">
          <span className="text-ink-500 text-sm">{t("total")}</span>
          <span className="text-xl font-bold text-ink-900">
            {formatFCFA(price)}
          </span>
        </div>

        <button
          disabled={!seat}
          onClick={() => seat && onSelect(seat)}
          className="btn-primary w-full mt-5"
        >
          {t("continue")}
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="text-[11px] text-center text-ink-400 mt-2">
          {seat ? t("change_seat_anytime") : t("select_seat_first")}
        </p>
      </aside>
    </div>
  );
}
