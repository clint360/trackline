"use client";

import { QRCodeSVG } from "qrcode.react";
import { forwardRef } from "react";
import { Bus, MapPin, Crown } from "lucide-react";
import { cn, formatDate, formatFCFA, formatTime } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { SeatClass } from "@/lib/types";

export interface TicketData {
  consignment: string;
  passengerName: string;
  fromCode: string;
  toCode: string;
  fromName?: string;
  toName?: string;
  agencyName: string;
  date: string;
  time: string;
  seat: string;
  seatClass: SeatClass;
  amount: number;
  dropOff?: string;
  status?: "valid" | "used" | "cancelled";
}

interface Props {
  data: TicketData;
  className?: string;
}

const statusStyle: Record<string, string> = {
  valid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  used: "bg-ink-100 text-ink-600 border-ink-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

export const Ticket = forwardRef<HTMLDivElement, Props>(function Ticket(
  { data, className },
  ref
) {
  const { t } = useI18n();
  const url = `https://trackline.cm/ticket/${data.consignment}`;
  const isVip = data.seatClass === "VIP";

  return (
    <div
      ref={ref}
      className={cn(
        "relative max-w-md w-full mx-auto bg-white rounded-3xl overflow-hidden shadow-card border border-ink-100",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "relative px-6 pt-6 pb-8 text-white overflow-hidden",
          isVip
            ? "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500"
            : "bg-gradient-to-br from-brand-600 via-brand-500 to-violet-600"
        )}
      >
        <div className="absolute inset-0 opacity-20 bg-grid-soft" style={{ backgroundSize: "20px 20px" }} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">
                {t("boarding_pass")}
              </p>
              <p className="text-sm font-semibold">{data.agencyName}</p>
            </div>
          </div>
          {isVip ? (
            <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase">
              <Crown className="h-3 w-3" /> VIP
            </span>
          ) : (
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase">
              Regular
            </span>
          )}
        </div>

        <div className="relative mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-70">From</p>
            <p className="text-3xl font-bold leading-none mt-1">{data.fromCode}</p>
            {data.fromName && <p className="text-xs opacity-80 mt-1">{data.fromName}</p>}
          </div>
          <div className="flex flex-col items-center text-white/80">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              <span className="h-px w-8 bg-white/60" />
              <Bus className="h-4 w-4" />
              <span className="h-px w-8 bg-white/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest opacity-70">To</p>
            <p className="text-3xl font-bold leading-none mt-1">{data.toCode}</p>
            {data.toName && <p className="text-xs opacity-80 mt-1">{data.toName}</p>}
          </div>
        </div>
      </div>

      {/* Perforation */}
      <div className="relative">
        <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-ink-50 border border-ink-100" />
        <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-ink-50 border border-ink-100" />
        <div className="border-t border-dashed border-ink-200 mx-6" />
      </div>

      {/* Body */}
      <div className="px-6 py-5 grid grid-cols-2 gap-y-4 gap-x-6">
        <Field label={t("passenger")} value={data.passengerName} />
        <Field label={t("date_label")} value={formatDate(data.date)} />
        <Field label={t("departure")} value={formatTime(data.time)} />
        <Field label={t("seat_label")} value={data.seat} highlight />
        <Field label={t("class")} value={data.seatClass} />
        <Field label={t("amount")} value={formatFCFA(data.amount)} />
        {data.dropOff && (
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold">
              {t("drop_off")}
            </p>
            <p className="mt-0.5 font-semibold text-ink-900 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-brand-500" />
              {data.dropOff}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-ink-200 mx-6" />

      {/* Footer with QR */}
      <div className="px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold">
            {t("consignment_no")}
          </p>
          <p className="font-mono text-sm font-bold text-ink-900 tracking-wider">
            {data.consignment}
          </p>
          {data.status && (
            <span
              className={cn(
                "inline-flex mt-2 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] uppercase font-semibold tracking-wider",
                statusStyle[data.status]
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  data.status === "valid" && "bg-emerald-500",
                  data.status === "used" && "bg-ink-400",
                  data.status === "cancelled" && "bg-rose-500"
                )}
              />
              {data.status}
            </span>
          )}
        </div>
        <div className="bg-white p-1.5 rounded-xl border border-ink-200 shrink-0">
          <QRCodeSVG value={url} size={80} level="M" />
        </div>
      </div>

      <div className="px-6 pb-4">
        <p className="text-[10px] text-center text-ink-400">{t("ticket_footer")}</p>
      </div>
    </div>
  );
});

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-semibold",
          highlight ? "text-brand-700 text-lg" : "text-ink-900"
        )}
      >
        {value}
      </p>
    </div>
  );
}
