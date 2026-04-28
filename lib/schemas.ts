import { z } from "zod";

export const routeSchema = z
  .object({
    fromCityId: z.string().min(1, "Select departure city"),
    toCityId: z.string().min(1, "Select arrival city"),
    date: z
      .string()
      .min(1, "Select a date")
      .refine((d) => !Number.isNaN(Date.parse(d)), "Invalid date"),
  })
  .refine((d) => d.fromCityId !== d.toCityId, {
    message: "Departure and arrival cannot be the same",
    path: ["toCityId"],
  });
export type RouteForm = z.infer<typeof routeSchema>;

// Cameroon phone format: optional +237 then 6/7 followed by 8 digits
const cmPhone = /^(?:\+?237)?\s?[26][\s\d]{8,12}$/;

export const passengerSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name is too short")
    .max(60, "Full name is too long")
    .regex(/^[A-Za-zÀ-ÿ' .-]+$/, "Use letters only"),
  phone: z
    .string()
    .min(8, "Phone too short")
    .regex(cmPhone, "Enter a valid Cameroon phone (e.g. 6XX XXX XXX)"),
});
export type PassengerForm = z.infer<typeof passengerSchema>;

export const paymentSchema = z.object({
  method: z.enum(["MTN", "ORANGE"], {
    errorMap: () => ({ message: "Choose a payment method" }),
  }),
  phone: z
    .string()
    .min(8, "Phone too short")
    .regex(cmPhone, "Enter a valid Cameroon phone"),
});
export type PaymentForm = z.infer<typeof paymentSchema>;

// Admin forms
export const cityFormSchema = z.object({
  name: z.string().min(2),
  code: z
    .string()
    .length(3, "Use a 3-letter code")
    .regex(/^[A-Z]+$/, "Uppercase only"),
});
export type CityForm = z.infer<typeof cityFormSchema>;

export const busTemplateFormSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["VIP", "Regular"]),
});
export type BusTemplateForm = z.infer<typeof busTemplateFormSchema>;

export const routeFormSchema = z
  .object({
    fromCityId: z.string().min(1),
    toCityId: z.string().min(1),
  })
  .refine((d) => d.fromCityId !== d.toCityId, {
    message: "Cities must differ",
    path: ["toCityId"],
  });
export type RouteFormType = z.infer<typeof routeFormSchema>;

export const scheduleFormSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm"),
  label: z.string().optional(),
});
export type ScheduleForm = z.infer<typeof scheduleFormSchema>;

export const tripFormSchema = z.object({
  routeId: z.string().min(1),
  busTemplateId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  priceRegular: z.coerce.number().int().positive(),
  priceVip: z.coerce.number().int().positive(),
});
export type TripForm = z.infer<typeof tripFormSchema>;
