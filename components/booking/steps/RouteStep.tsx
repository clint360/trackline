"use client";

import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowUpDown, Calendar, MapPin, Shield } from "lucide-react";
import { CITIES } from "@/lib/mock-data";
import { routeSchema, type RouteForm } from "@/lib/schemas";
import { cn, todayISO } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Field, Input } from "@/components/ui/Field";

const SELECT_CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")";

export function RouteStep({
  initial,
  onSubmit,
}: {
  initial?: RouteForm;
  onSubmit: (r: RouteForm) => void;
}) {
  const { t } = useI18n();
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RouteForm>({
    resolver: zodResolver(routeSchema),
    defaultValues: initial ?? {
      fromCityId: CITIES[0].id,
      toCityId: CITIES[1].id,
      date: todayISO(),
    },
  });

  const fromCity = useController({ name: "fromCityId", control });
  const toCity = useController({ name: "toCityId", control });
  const dateCtrl = useController({ name: "date", control });

  const swap = () => {
    setValue("fromCityId", toCity.field.value, { shouldValidate: true });
    setValue("toCityId", fromCity.field.value, { shouldValidate: true });
  };

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="card p-5 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-ink-900 text-balance">
          {t("where_to_next")}
        </h2>
        <p className="text-ink-500 text-sm mt-1">{t("compare_subtitle")}</p>

        <div className="mt-6">
          {/* Desktop: side-by-side with centred swap */}
          <div className="hidden sm:flex sm:flex-row sm:items-end gap-7">
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
                    value={fromCity.field.value}
                    onChange={fromCity.field.onChange}
                    onBlur={fromCity.field.onBlur}
                    name={fromCity.field.name}
                    ref={fromCity.field.ref}
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

            {/* Swap */}
            <div className="flex justify-center pb-2.5">
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
                  "active:scale-95 transition-all"
                )}
              >
                <ArrowUpDown className="h-4 w-4" />
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
                    value={toCity.field.value}
                    onChange={toCity.field.onChange}
                    onBlur={toCity.field.onBlur}
                    name={toCity.field.name}
                    ref={toCity.field.ref}
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

          {/* Mobile: stacked inputs with a left-hand dotted rail and uncircled swap. */}
          <div className="flex sm:hidden gap-3">
            {/* Left visual rail */}
            <div className="flex flex-col items-center w-6 shrink-0 py-1">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-500 ring-[3px] ring-brand-100" />
              <div className="flex-1 w-px border-l-2 border-dashed border-ink-300 my-2" />
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-[3px] ring-rose-100" />
            </div>

            {/* Stacked fields */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              {/* From */}
              <div>
                <label
                  htmlFor="from-city-m"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
                >
                  {t("from")}
                </label>
                <div
                  className={cn(
                    "rounded-2xl border bg-white px-4 py-3 transition-all",
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
                      id="from-city-m"
                      value={fromCity.field.value}
                      onChange={fromCity.field.onChange}
                      onBlur={fromCity.field.onBlur}
                      name={fromCity.field.name}
                      aria-invalid={!!errors.fromCityId}
                      className="appearance-none w-full bg-transparent text-ink-900 outline-none pl-6 pr-7 py-0.5 text-base font-semibold cursor-pointer"
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

              {/* To */}
              <div>
                <label
                  htmlFor="to-city-m"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
                >
                  {t("to")}
                </label>
                <div
                  className={cn(
                    "rounded-2xl border bg-white px-4 py-3 transition-all",
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
                      id="to-city-m"
                      value={toCity.field.value}
                      onChange={toCity.field.onChange}
                      onBlur={toCity.field.onBlur}
                      name={toCity.field.name}
                      aria-invalid={!!errors.toCityId}
                      className="appearance-none w-full bg-transparent text-ink-900 outline-none pl-6 pr-7 py-0.5 text-base font-semibold cursor-pointer"
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

            {/* Right swap */}
            <div className="flex flex-col justify-center shrink-0">
              <button
                type="button"
                onClick={swap}
                aria-label={t("swap_cities")}
                title={t("swap_cities")}
                className="text-ink-400 hover:text-brand-600 active:scale-95 transition-all"
              >
                <ArrowUpDown className="h-5 w-5" />
              </button>
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
                value={dateCtrl.field.value}
                onChange={dateCtrl.field.onChange}
                onBlur={dateCtrl.field.onBlur}
                name={dateCtrl.field.name}
                ref={dateCtrl.field.ref}
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
