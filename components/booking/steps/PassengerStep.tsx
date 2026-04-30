"use client";

import { ChevronLeft, Mail, Phone, User, ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passengerSchema, type PassengerForm } from "@/lib/schemas";
import { useI18n } from "@/lib/i18n";
import { Field, Input } from "@/components/ui/Field";

export function PassengerStep({
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
    defaultValues: initial ?? { fullName: "", phone: "", email: "" },
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

          <Field
            label={t("email_optional")}
            error={errors.email?.message}
            hint={t("email_hint")}
          >
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="jane@example.com"
                className="pl-10"
                {...register("email")}
                invalid={!!errors.email}
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
