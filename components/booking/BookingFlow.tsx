"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftRight,
  ArrowRight,
  Bus,
  Calendar,
  ChevronLeft,
  Download,
  FileDown,
  Loader2,
  MapPin,
  Phone,
  Shield,
  Smartphone,
  User,
} from "lucide-react";
import { CITIES, listSeatLabels } from "@/lib/mock-data";
import {
  passengerSchema,
  paymentSchema,
  routeSchema,
  type PassengerForm,
  type PaymentForm,
  type RouteForm,
} from "@/lib/schemas";
import type { SearchedTrip, SeatClass } from "@/lib/types";
import { cn, formatDate, formatFCFA, formatTime, todayISO } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Field, Input, Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { StepIndicator } from "./StepIndicator";
import { TripCard } from "./TripCard";
import { SeatMap } from "./SeatMap";
import { Ticket, type TicketData } from "./Ticket";
import { downloadAsPdf, downloadAsPng } from "@/lib/download";

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")";

interface BookingState {
  route?: RouteForm;
  trip?: SearchedTrip;
  seatClass?: SeatClass;
  seat?: string;
  passenger?: PassengerForm;
  payment?: PaymentForm;
  ticket?: TicketData;
}

export function BookingFlow() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<BookingState>({});
  const { t } = useI18n();

  const goNext = () => setStep((s) => Math.min(s + 1, 5));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const STEPS = [
    { key: "route", label: t("step_route") },
    { key: "trip", label: t("step_trip") },
    { key: "seat", label: t("step_seat") },
    { key: "passenger", label: t("step_passenger") },
    { key: "payment", label: t("step_payment") },
    { key: "ticket", label: t("step_ticket") },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-2xl bg-brand-gradient text-white flex items-center justify-center shadow-glow">
            <Bus className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-ink-900 leading-none">Trackline</h1>
            <p className="text-[11px] text-ink-500 truncate">{t("brand_tagline")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <a
            href="/dashboard"
            className="hidden sm:inline text-xs text-ink-500 hover:text-brand-600 transition-colors"
          >
            {t("operator_dashboard")}
          </a>
        </div>
      </header>

      {/* Progress */}
      <div className="card p-5 sm:p-6 mb-6">
        <StepIndicator steps={STEPS} current={step} />
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
          >
            {step === 0 && (
              <RouteStep
                initial={state.route}
                onSubmit={(r) => {
                  setState({ ...state, route: r });
                  goNext();
                }}
              />
            )}
            {step === 1 && state.route && (
              <TripStep
                route={state.route}
                onBack={goBack}
                onSelect={(trip, klass) => {
                  setState({ ...state, trip, seatClass: klass });
                  goNext();
                }}
              />
            )}
            {step === 2 && state.trip && state.seatClass && (
              <SeatStep
                trip={state.trip}
                seatClass={state.seatClass}
                initialSeat={state.seat}
                onBack={goBack}
                onSelect={(seat) => {
                  setState({ ...state, seat });
                  goNext();
                }}
              />
            )}
            {step === 3 && (
              <PassengerStep
                initial={state.passenger}
                onBack={goBack}
                onSubmit={(p) => {
                  setState({ ...state, passenger: p });
                  goNext();
                }}
              />
            )}
            {step === 4 &&
              state.trip &&
              state.seat &&
              state.seatClass &&
              state.passenger && (
                <PaymentStep
                  trip={state.trip}
                  seat={state.seat}
                  seatClass={state.seatClass}
                  passenger={state.passenger}
                  onBack={goBack}
                  onSuccess={(ticket) => {
                    setState({ ...state, ticket });
                    goNext();
                  }}
                />
              )}
            {step === 5 && state.ticket && (
              <TicketStep
                ticket={state.ticket}
                onRestart={() => {
                  setState({});
                  setStep(0);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------------- Step 1: Route ---------------- */

function RouteStep({
  initial,
  onSubmit,
}: {
  initial?: RouteForm;
  onSubmit: (r: RouteForm) => void;
}) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RouteForm>({
    resolver: zodResolver(routeSchema),
    defaultValues: initial ?? {
      fromCityId: CITIES[0].id,
      toCityId: CITIES[1].id,
      date: todayISO(),
    },
  });

  const swap = () => {
    const a = watch("fromCityId");
    const b = watch("toCityId");
    setValue("fromCityId", b, { shouldValidate: true });
    setValue("toCityId", a, { shouldValidate: true });
  };

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="card p-5 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-ink-900 text-balance">
          {t("where_to_next")}
        </h2>
        <p className="text-ink-500 text-sm mt-1">{t("compare_subtitle")}</p>

        {/*
          Labels sit ABOVE each field. Two separate rounded cards hold just
          the inputs, with the swap arrow centered in the wider gap between.
        */}
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-7">
            {/* From column */}
            <div className="flex-1 min-w-0">
              <label
                htmlFor="from-city"
                className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
              >
                {t("from")}
              </label>
              <div
                className={cn(
                  "rounded-2xl border bg-white px-4 py-3 sm:px-5 sm:py-3.5 transition-all",
                  "focus-within:border-brand-400 focus-within:shadow-ring",
                  errors.fromCityId ? "border-rose-300" : "border-ink-200"
                )}
              >
                <div className="relative">
                  <MapPin
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-500 pointer-events-none"
                    aria-hidden
                  />
                  <select
                    id="from-city"
                    {...register("fromCityId")}
                    aria-invalid={!!errors.fromCityId}
                    className="appearance-none w-full bg-transparent text-ink-900 outline-none pl-6 pr-7 py-0.5 text-base sm:text-lg font-semibold cursor-pointer"
                    style={{
                      backgroundImage: SELECT_CHEVRON,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0 center",
                      backgroundSize: "1.1rem",
                    }}
                  >
                    {CITIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Swap — vertically centered against the input cards.
                items-end on parent + sm:pb-2.5 nudges this to align with
                the middle of the field box (since the field column is
                taller by the label height above). */}
            <div className="flex justify-center -my-2 sm:my-0 sm:pb-2.5">
              <button
                type="button"
                onClick={swap}
                aria-label={t("swap_cities")}
                title={t("swap_cities")}
                className={cn(
                  "h-10 w-10 rounded-full bg-white text-ink-600",
                  "ring-1 ring-ink-200 shadow-soft",
                  "flex items-center justify-center",
                  "hover:text-brand-600 hover:ring-brand-300 hover:shadow-card",
                  "active:scale-95 transition-all duration-300",
                  "group"
                )}
              >
                <ArrowLeftRight
                  className={cn(
                    "h-4 w-4 rotate-90 sm:rotate-0",
                    "group-hover:sm:rotate-180 transition-transform duration-300"
                  )}
                />
              </button>
            </div>

            {/* To column */}
            <div className="flex-1 min-w-0">
              <label
                htmlFor="to-city"
                className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
              >
                {t("to")}
              </label>
              <div
                className={cn(
                  "rounded-2xl border bg-white px-4 py-3 sm:px-5 sm:py-3.5 transition-all",
                  "focus-within:border-brand-400 focus-within:shadow-ring",
                  errors.toCityId ? "border-rose-300" : "border-ink-200"
                )}
              >
                <div className="relative">
                  <MapPin
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500 pointer-events-none"
                    aria-hidden
                  />
                  <select
                    id="to-city"
                    {...register("toCityId")}
                    aria-invalid={!!errors.toCityId}
                    className="appearance-none w-full bg-transparent text-ink-900 outline-none pl-6 pr-7 py-0.5 text-base sm:text-lg font-semibold cursor-pointer"
                    style={{
                      backgroundImage: SELECT_CHEVRON,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0 center",
                      backgroundSize: "1.1rem",
                    }}
                  >
                    {CITIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {(errors.fromCityId || errors.toCityId) && (
            <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
              <span className="inline-block h-1 w-1 rounded-full bg-rose-500" />
              {errors.fromCityId?.message ?? errors.toCityId?.message}
            </p>
          )}
        </div>

        <div className="mt-3 sm:mt-4">
          <Field label={t("travel_date")} error={errors.date?.message}>
            <div className="relative w-full min-w-0">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none z-10" />
              <Input
                type="date"
                min={todayISO()}
                className="pl-10 w-full block"
                {...register("date")}
                invalid={!!errors.date}
              />
            </div>
          </Field>
        </div>

        <button type="submit" className="btn-primary w-full mt-6 group">
          {t("search_trips")}
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </form>

      {/* Promo / hero card */}
      <aside className="relative card overflow-hidden p-0">
        <div className="absolute inset-0 bg-grid-soft opacity-50" style={{ backgroundSize: "24px 24px" }} />
        <div className="relative p-6 sm:p-8 h-full flex flex-col">
          <div className="rounded-2xl bg-brand-gradient text-white px-3 py-1.5 text-xs font-semibold w-fit shadow-glow">
            {t("hero_badge")}
          </div>
          <h3 className="text-lg font-bold text-ink-900 mt-4 leading-snug">
            {t("hero_title")}
          </h3>
          <p className="text-sm text-ink-500 mt-1.5">{t("hero_subtitle")}</p>

          <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
            {[
              { label: t("agencies"), value: "5+" },
              { label: t("daily_trips"), value: "30+" },
              { label: t("avg_wait"), value: "< 2 min" },
              { label: t("secure_pay"), value: "MoMo / OM" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-ink-100 bg-white/70 p-3"
              >
                <div className="text-base font-bold text-ink-900">
                  {s.value}
                </div>
                <div className="text-[11px] text-ink-500">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6 flex items-center gap-2 text-xs text-ink-500">
            <Shield className="h-3.5 w-3.5" />
            {t("encrypted_checkout")}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ---------------- Step 2: Trip ---------------- */

function TripStep({
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

/* ---------------- Step 3: Seat ---------------- */

function SeatStep({
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

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink-500">{label}</span>
      <span
        className={cn(
          "font-medium text-ink-800 truncate",
          highlight && "text-brand-700"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ---------------- Step 4: Passenger ---------------- */

function PassengerStep({
  initial,
  onBack,
  onSubmit,
}: {
  initial?: PassengerForm;
  onBack: () => void;
  onSubmit: (p: PassengerForm) => void;
}) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PassengerForm>({
    resolver: zodResolver(passengerSchema),
    defaultValues: initial ?? { fullName: "", phone: "" },
  });

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={onBack} className="btn-ghost text-sm mb-4">
        <ChevronLeft className="h-4 w-4" /> {t("back")}
      </button>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 sm:p-8">
        <h2 className="text-xl font-bold text-ink-900">{t("passenger_details")}</h2>
        <p className="text-ink-500 text-sm mt-1">{t("print_on_ticket")}</p>

        <div className="mt-6 space-y-4">
          <Field label={t("full_name")} error={errors.fullName?.message}>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
              <Input
                placeholder="Jane Mbarga"
                className="pl-10"
                {...register("fullName")}
                invalid={!!errors.fullName}
              />
            </div>
          </Field>

          <Field
            label={t("phone_number")}
            error={errors.phone?.message}
            hint={t("cm_phone_hint")}
          >
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
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

        <button type="submit" className="btn-primary w-full mt-6">
          {t("continue_to_payment")}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

/* ---------------- Step 5: Payment ---------------- */

function PaymentStep({
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
  const [loading, setLoading] = useState(false);
  const dropOffLabel = trip.dropOff?.name ?? `${trip.toCity.name} — ${t("city_center")}`;

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
    setLoading(true);
    try {
      // 90% chance success simulation
      const ok = Math.random() < 0.9;
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tripId: trip.id,
          seat,
          seatClass,
          amount,
          paymentMethod: data.method,
          passenger,
          agencyName: trip.agency.name,
          fromCode: trip.fromCity.code,
          toCode: trip.toCity.code,
          date: trip.date,
          time: trip.time,
        }),
      });
      const j = await res.json();
      if (!ok || !res.ok) throw new Error(t("payment_declined"));
      const b = j.booking;
      toast.success(t("payment_confirmed"));
      onSuccess({
        consignment: b.consignment,
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
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

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

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
            {loading ? (
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
          <Row label={t("agency")} value={trip.agency.name} />
          <Row
            label={t("route")}
            value={`${trip.fromCity.name} → ${trip.toCity.name}`}
          />
          <Row label={t("drop_off")} value={dropOffLabel} />
          <Row label={t("date_label")} value={formatDate(trip.date)} />
          <Row label={t("departure")} value={formatTime(trip.time)} />
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

/* ---------------- Step 6: Ticket ---------------- */

function TicketStep({
  ticket,
  onRestart,
}: {
  ticket: TicketData;
  onRestart: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const png = async () => {
    if (!ref.current) return;
    try {
      await downloadAsPng(ref.current, `${ticket.consignment}.png`);
      toast.success(t("png_downloaded"));
    } catch {
      toast.error(t("export_failed_png"));
    }
  };

  const pdf = async () => {
    if (!ref.current) return;
    try {
      await downloadAsPdf(ref.current, `${ticket.consignment}.pdf`);
      toast.success(t("pdf_downloaded"));
    } catch {
      toast.error(t("export_failed_pdf"));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-semibold"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t("booking_confirmed")}
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mt-3 text-balance">
          {t("ticket_ready")}
        </h2>
        <p className="text-ink-500 text-sm mt-1">{t("sms_copy")}</p>
      </div>

      <Ticket ref={ref} data={ticket} />

      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <button onClick={png} className="btn-secondary">
          <Download className="h-4 w-4" /> {t("download_png")}
        </button>
        <button onClick={pdf} className="btn-secondary">
          <FileDown className="h-4 w-4" /> {t("download_pdf")}
        </button>
        <button onClick={onRestart} className="btn-primary">
          {t("book_another")}
        </button>
      </div>

      <p className="text-center text-xs text-ink-400 mt-4">
        {t("lookup_link")}:{" "}
        <a
          className="text-brand-600 hover:underline"
          href={`/ticket/${ticket.consignment}`}
        >
          /ticket/{ticket.consignment}
        </a>
      </p>
    </div>
  );
}
