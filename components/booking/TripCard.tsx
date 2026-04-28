"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, Users, Crown, Bus } from "lucide-react";
import type { SearchedTrip, SeatClass } from "@/lib/types";
import { cn, formatFCFA, formatTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface Props {
  trip: SearchedTrip;
  onSelect: (klass: SeatClass) => void;
  selectedKlass?: SeatClass;
  index?: number;
}

const availabilityStyle: Record<string, string> = {
  "Almost full": "bg-rose-50 text-rose-700 border-rose-200",
  "Fast filling": "bg-amber-50 text-amber-700 border-amber-200",
  Available: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function TripCard({ trip, onSelect, selectedKlass, index = 0 }: Props) {
  const { t } = useI18n();
  const seatsLeft = trip.seatsLeft ?? 0;
  const dropOffLabel = trip.dropOff?.name ?? `${trip.toCity.name} — ${t("city_center")}`;
  const availabilityKey =
    trip.availabilityLabel === "Almost full"
      ? "almost_full"
      : trip.availabilityLabel === "Fast filling"
        ? "fast_filling"
        : "available";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 22 }}
      className="card p-5 sm:p-6 hover:shadow-glow transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={cn(
              "h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center shadow-soft",
              trip.agency.logoColor
            )}
          >
            <Bus className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-900 truncate">{trip.agency.name}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-ink-500">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(trip.time)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {seatsLeft} {t("seats_left")}
              </span>
              <span
                className={cn(
                  "badge border",
                  availabilityStyle[trip.availabilityLabel]
                )}
              >
                {trip.availabilityLabel === "Almost full" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                )}
                {t(availabilityKey as any)}
              </span>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-500">
              <MapPin className="h-3 w-3 text-brand-500" />
              <span className="truncate">
                {t("drops_off_at")}: <span className="text-ink-700 font-medium">{dropOffLabel}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-stretch sm:gap-3">
          <ClassButton
            klass="Regular"
            price={trip.priceRegular}
            selected={selectedKlass === "Regular"}
            onClick={() => onSelect("Regular")}
          />
          <ClassButton
            klass="VIP"
            price={trip.priceVip}
            selected={selectedKlass === "VIP"}
            onClick={() => onSelect("VIP")}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ClassButton({
  klass,
  price,
  selected,
  onClick,
}: {
  klass: SeatClass;
  price: number;
  selected: boolean;
  onClick: () => void;
}) {
  const isVip = klass === "VIP";
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border px-4 py-2.5 text-left transition-all min-w-[120px]",
        selected
          ? isVip
            ? "border-amber-400 bg-amber-50/60 ring-2 ring-amber-300"
            : "border-brand-500 bg-brand-50 ring-2 ring-brand-300"
          : "border-ink-200 hover:border-brand-300 hover:bg-brand-50/40"
      )}
    >
      <div className="flex items-center gap-1.5">
        {isVip && <Crown className="h-3.5 w-3.5 text-amber-500" />}
        <span
          className={cn(
            "text-[11px] font-bold uppercase tracking-wide",
            isVip ? "text-amber-700" : "text-brand-700"
          )}
        >
          {klass}
        </span>
      </div>
      <div className="font-bold text-ink-900 mt-0.5 text-sm sm:text-base">
        {formatFCFA(price)}
      </div>
    </motion.button>
  );
}
