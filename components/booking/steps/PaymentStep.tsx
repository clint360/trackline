"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  ChevronLeft,
  Loader2,
  Shield,
  Smartphone,
  X,
} from "lucide-react";
import type { SearchedTrip, SeatClass } from "@/lib/types";
import { cn, formatFCFA } from "@/lib/utils";
import { paymentSchema, type PaymentForm, type PassengerForm } from "@/lib/schemas";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import { Field, Input } from "@/components/ui/Field";
import { Row } from "@/components/booking/shared";
import type { TicketData } from "@/components/booking/Ticket";

/* ---------- Payment draft (refresh recovery) ---------- */

const PAYMENT_DRAFT_KEY = "trackline:payment:inflight";

type PaymentPhase =
  | { kind: "form" }
  | {
      kind: "polling";
      transId: string;
      method: "MTN" | "ORANGE";
      payerPhone: string;
      externalId: string;
      startedAt: number;
    }
  | { kind: "failed"; reason: string };

function loadPaymentDraft(tripId: string, seat: string): PaymentPhase | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PAYMENT_DRAFT_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (j.tripId !== tripId || j.seat !== seat) return null;
    if (Date.now() - (j.startedAt ?? 0) > 10 * 60 * 1000) return null;
    return {
      kind: "polling",
      transId: j.transId,
      method: j.method,
      payerPhone: j.payerPhone,
      externalId: j.externalId,
      startedAt: j.startedAt,
    };
  } catch {
    return null;
  }
}

function savePaymentDraft(args: {
  tripId: string;
  seat: string;
  transId: string;
  method: "MTN" | "ORANGE";
  payerPhone: string;
  externalId: string;
  startedAt: number;
}) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAYMENT_DRAFT_KEY, JSON.stringify(args));
  } catch {}
}

function clearPaymentDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PAYMENT_DRAFT_KEY);
  } catch {}
}

/* ---------- Main Payment Step ---------- */

export function PaymentStep({
  trip,
  seat,
  seatClass,
  passenger,
  onBack,
  onSuccess,
}: {
  trip: SearchedTrip;
  seat: string;
  seatClass: SeatClass;
  passenger: PassengerForm;
  onBack: () => void;
  onSuccess: (t: TicketData) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const amount = seatClass === "VIP" ? trip.priceVip : trip.priceRegular;
  const dropOffLabel =
    trip.dropOff?.name ?? `${trip.toCity.name} — ${t("city_center")}`;

  const [phase, setPhase] = useState<PaymentPhase>({ kind: "form" });
  const [submitting, setSubmitting] = useState(false);

  // Resume in-flight payment on mount (refresh recovery)
  useEffect(() => {
    const draft = loadPaymentDraft(trip.id, seat);
    if (draft && draft.kind === "polling") {
      setPhase(draft);
      toast.info(t("resume_payment"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id, seat]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: "MTN", phone: passenger.phone },
  });

  const method = watch("method");

  const onSubmit = async (data: PaymentForm) => {
    setSubmitting(true);
    try {
      const externalId = `${trip.fromCity.code}-${trip.toCity.code}-${Date.now()}`;
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount,
          phone: data.phone,
          method: data.method,
          passengerName: passenger.fullName,
          email: passenger.email,
          externalId,
          message: `Trackline ${trip.fromCity.code}→${trip.toCity.code} seat ${seat}`,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.transId) {
        const msg =
          (j?.error && typeof j.error === "string" && j.error) ||
          t("payment_declined");
        throw new Error(msg);
      }
      const startedAt = Date.now();
      const next: PaymentPhase = {
        kind: "polling",
        transId: j.transId,
        method: data.method,
        payerPhone: data.phone,
        externalId,
        startedAt,
      };
      savePaymentDraft({
        tripId: trip.id,
        seat,
        transId: j.transId,
        method: data.method,
        payerPhone: data.phone,
        externalId,
        startedAt,
      });
      setPhase(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onPollSucceeded = async () => {
    if (phase.kind !== "polling") return;
    // Persist booking on the server now that money is in.
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tripId: trip.id,
          seat,
          seatClass,
          amount,
          paymentMethod: phase.method,
          passenger,
          agencyName: trip.agency.name,
          fromCode: trip.fromCity.code,
          toCode: trip.toCity.code,
          date: trip.date,
          time: trip.time,
          paymentTransId: phase.transId,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.booking) throw new Error("Could not save booking");
      clearPaymentDraft();
      toast.success(t("payment_confirmed"));
      onSuccess({
        consignment: j.booking.consignment,
        passengerName: passenger.fullName,
        fromCode: trip.fromCity.code,
        toCode: trip.toCity.code,
        fromName: trip.fromCity.name,
        toName: trip.toCity.name,
        agencyName: trip.agency.name,
        date: trip.date,
        time: trip.time,
        seat,
        seatClass,
        amount,
        dropOff: dropOffLabel,
        status: "valid",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Booking save failed";
      toast.error(msg);
      setPhase({ kind: "failed", reason: msg });
      clearPaymentDraft();
    }
  };

  const onPollFailed = (reason: string) => {
    clearPaymentDraft();
    setPhase({ kind: "failed", reason });
  };

  const restart = () => {
    clearPaymentDraft();
    setPhase({ kind: "form" });
  };

  if (phase.kind === "polling") {
    return (
      <PaymentPolling
        transId={phase.transId}
        method={phase.method}
        amount={amount}
        externalId={phase.externalId}
        startedAt={phase.startedAt}
        onSucceeded={onPollSucceeded}
        onFailed={onPollFailed}
        onCancel={restart}
      />
    );
  }

  if (phase.kind === "failed") {
    return (
      <PaymentFailed
        reason={phase.reason}
        onRetry={restart}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
      <div>
        <button onClick={onBack} className="btn-ghost text-sm mb-4">
          <ChevronLeft className="h-4 w-4" /> {t("back")}
        </button>
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-ink-900">{t("payment")}</h2>
          <p className="text-ink-500 text-sm mt-1">{t("payment_subtitle")}</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <PaymentOption
              selected={method === "MTN"}
              onClick={() => setValue("method", "MTN", { shouldValidate: true })}
              brandColor="from-amber-400 to-yellow-500"
              label="MTN MoMo"
              hint={t("pay_with_mtn")}
            />
            <PaymentOption
              selected={method === "ORANGE"}
              onClick={() =>
                setValue("method", "ORANGE", { shouldValidate: true })
              }
              brandColor="from-orange-500 to-red-500"
              label="Orange Money"
              hint={t("pay_with_orange")}
            />
          </div>
          {errors.method && (
            <p className="text-xs text-rose-600 mt-1.5">
              {errors.method.message}
            </p>
          )}

          <div className="mt-5">
            <Field label={t("mobile_money_phone")} error={errors.phone?.message}>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
                <Input
                  inputMode="tel"
                  placeholder="+237 6 XX XX XX XX"
                  className="pl-10"
                  {...register("phone")}
                  invalid={!!errors.phone}
                />
              </div>
            </Field>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-6">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("processing")}
              </>
            ) : (
              <>
                {t("pay")} {formatFCFA(amount)}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-ink-400 mt-3 flex items-center justify-center gap-1.5">
            <Shield className="h-3 w-3" /> {t("encrypted_note")}
          </p>
        </form>
      </div>

      <aside className="card p-5 sm:p-6 lg:sticky lg:top-4">
        <h3 className="font-semibold text-ink-900">{t("order_summary")}</h3>
        <div className="mt-4 space-y-3 text-sm">
          <Row label={t("passenger")} value={passenger.fullName} />
          {passenger.email && (
            <Row label="Email" value={passenger.email} />
          )}
          <Row label={t("agency")} value={trip.agency.name} />
          <Row
            label={t("route")}
            value={`${trip.fromCity.name} → ${trip.toCity.name}`}
          />
          <Row label={t("drop_off")} value={dropOffLabel} />
          <Row label={t("date_label")} value={trip.date} />
          <Row label={t("departure")} value={trip.time} />
          <Row label={t("class")} value={seatClass} />
          <Row label={t("seat_label")} value={seat} highlight />
        </div>
        <div className="mt-5 pt-5 border-t border-ink-100 flex items-center justify-between">
          <span className="text-ink-500 text-sm">{t("total")}</span>
          <span className="text-xl font-bold text-ink-900">
            {formatFCFA(amount)}
          </span>
        </div>
      </aside>
    </div>
  );
}

/* ---------- Polling sub-component ---------- */

function PaymentPolling({
  transId,
  method,
  amount,
  externalId,
  startedAt,
  onSucceeded,
  onFailed,
  onCancel,
}: {
  transId: string;
  method: "MTN" | "ORANGE";
  amount: number;
  externalId: string;
  startedAt: number;
  onSucceeded: () => void;
  onFailed: (reason: string) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const stopRef = useRef(false);

  useEffect(() => {
    stopRef.current = false;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/payments/status/${transId}`, {
          cache: "no-store",
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error ?? "Status check failed");
        if (cancelled || stopRef.current) return;
        if (j.status === "SUCCESSFUL") {
          stopRef.current = true;
          onSucceeded();
          return;
        }
        if (j.status === "FAILED") {
          stopRef.current = true;
          onFailed(t("payment_failed_body"));
          return;
        }
        if (j.status === "EXPIRED") {
          stopRef.current = true;
          onFailed(t("payment_expired"));
          return;
        }
        // PENDING — keep polling
      } catch (e) {
        // Network blip — keep retrying. Surface only after 30s of failures.
        if (Date.now() - startedAt > 5 * 60 * 1000) {
          stopRef.current = true;
          onFailed(e instanceof Error ? e.message : "Network error");
        }
      }
    };
    const id = setInterval(() => {
      setTick((x) => x + 1);
      if (!stopRef.current) poll();
    }, 3000);
    poll();
    return () => {
      cancelled = true;
      stopRef.current = true;
      clearInterval(id);
    };
  }, [transId, startedAt, onSucceeded, onFailed, t]);

  // Rotating reassurance lines. Stay friendly, never alarmist.
  const rotation: Array<keyof typeof ROTATION_KEYS> = [
    "status_checking",
    "status_pending",
    "status_almost",
    "status_confirming",
  ];
  const message = rotation[tick % rotation.length];

  const elapsed = Math.round((Date.now() - startedAt) / 1000);

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-7 sm:p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/60 via-white to-white" />

        {/* Pulsing ring with phone icon */}
        <div className="relative h-24 w-24 mx-auto">
          <motion.span
            className="absolute inset-0 rounded-full bg-brand-200/60"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.span
            className="absolute inset-0 rounded-full bg-brand-300/40"
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 2, delay: 0.6, repeat: Infinity, ease: "easeOut" }}
          />
          <div className="relative h-24 w-24 rounded-full bg-brand-gradient text-white flex items-center justify-center shadow-glow">
            <Smartphone className="h-9 w-9" />
          </div>
        </div>

        <h2 className="mt-6 text-xl sm:text-2xl font-bold text-ink-900 tracking-tight">
          {t("follow_instructions")}
        </h2>
        <p className="mt-2 text-sm text-ink-600 leading-relaxed max-w-md mx-auto">
          {t("follow_instructions_body")}
        </p>

        {/* Amount + ref pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700">
            <span className="text-ink-400">{t("amount_to_pay")}</span>
            <span className="font-mono font-bold text-ink-900">
              {formatFCFA(amount)}
            </span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700">
            <span className="text-ink-400">{t("ref")}</span>
            <span className="font-mono">{externalId.slice(-10)}</span>
          </span>
          <span
            className={
              method === "MTN"
                ? "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold border-amber-300 bg-amber-50 text-amber-800"
                : "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold border-orange-300 bg-orange-50 text-orange-800"
            }
          >
            {method === "MTN" ? "MTN MoMo" : "Orange Money"}
          </span>
        </div>

        {/* Live status line */}
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-ink-700">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
          <AnimatePresence mode="wait">
            <motion.span
              key={message}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              {t(message)}
            </motion.span>
          </AnimatePresence>
        </div>

        <p className="mt-3 text-[11px] text-ink-400">
          {t("do_not_close")} · {elapsed}s
        </p>

        <button
          onClick={onCancel}
          className="mt-6 text-xs text-ink-500 hover:text-rose-600 underline underline-offset-2"
        >
          Cancel and use a different number
        </button>
      </div>
    </div>
  );
}

// only used for typed key narrowing above
const ROTATION_KEYS = {
  status_checking: 1,
  status_pending: 1,
  status_almost: 1,
  status_confirming: 1,
} as const;

/* ---------- PaymentFailed ---------- */

function PaymentFailed({
  reason,
  onRetry,
  onBack,
}: {
  reason: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="max-w-md mx-auto">
      <div className="card p-7 sm:p-10 text-center">
        <div className="h-14 w-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <X className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-ink-900 mt-5">
          {t("payment_failed_title")}
        </h2>
        <p className="text-sm text-ink-600 mt-2 leading-relaxed">{reason}</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <button onClick={onRetry} className="btn-primary">
            {t("try_again")}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={onBack} className="btn-ghost">
            <ChevronLeft className="h-4 w-4" />
            {t("back")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- PaymentOption ---------- */

function PaymentOption({
  selected,
  onClick,
  label,
  hint,
  brandColor,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  brandColor: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition-all",
        selected
          ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-200"
          : "border-ink-200 hover:border-brand-300"
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs shadow-soft",
          brandColor
        )}
      >
        $
      </div>
      <div className="mt-3 font-semibold text-ink-900 text-sm">{label}</div>
      <div className="text-xs text-ink-500 mt-0.5">{hint}</div>
    </motion.button>
  );
}
