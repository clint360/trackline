// Centralized typed Supabase queries used by API routes and the dashboard.
//
// All functions accept a SupabaseClient (browser or admin) so the same code
// works on either side; reads should use the anon client (RLS gated), writes
// must use the admin client.

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Agency,
  Booking,
  BusTemplate,
  City,
  Route,
  Schedule,
  SearchedTrip,
  Trip,
} from "@/lib/types";
import {
  rowToAgency,
  rowToBooking,
  rowToBusTemplate,
  rowToCity,
  rowToDropOff,
  rowToRoute,
  rowToSchedule,
  rowToTrip,
} from "./mappers";

// ---- Catalog: full bundle for the dashboard ----

export interface CatalogBundle {
  cities: City[];
  agencies: Agency[];
  busTemplates: BusTemplate[];
  routes: Route[];
  schedules: Schedule[];
  trips: Trip[];
  bookings: Booking[];
}

export async function fetchCatalog(sb: SupabaseClient): Promise<CatalogBundle> {
  const [cities, dropoffs, agencies, templates, routes, schedules, trips, bookings] =
    await Promise.all([
      sb.from("cities").select("*").order("name"),
      sb.from("dropoffs").select("*"),
      sb.from("agencies").select("*").order("name"),
      sb.from("bus_templates").select("*").order("name"),
      sb.from("routes").select("*"),
      sb.from("schedules").select("*").order("time"),
      sb.from("trips").select("*").order("date").order("time"),
      sb.from("bookings").select("*").order("created_at", { ascending: false }),
    ]);

  // Surface the first error if any
  const errs = [cities, dropoffs, agencies, templates, routes, schedules, trips, bookings]
    .map((r) => r.error)
    .filter(Boolean);
  if (errs.length) {
    throw new Error(errs.map((e) => e?.message).join("; "));
  }

  // Group dropoffs by city
  const dropByCity = new Map<string, any[]>();
  for (const d of dropoffs.data ?? []) {
    const arr = dropByCity.get(d.city_id) ?? [];
    arr.push(d);
    dropByCity.set(d.city_id, arr);
  }

  return {
    cities: (cities.data ?? []).map((c) => rowToCity(c, dropByCity.get(c.id) ?? [])),
    agencies: (agencies.data ?? []).map(rowToAgency),
    busTemplates: (templates.data ?? []).map(rowToBusTemplate),
    routes: (routes.data ?? []).map(rowToRoute),
    schedules: (schedules.data ?? []).map(rowToSchedule),
    trips: (trips.data ?? []).map(rowToTrip),
    bookings: (bookings.data ?? []).map(rowToBooking),
  };
}

// ---- Trip search ----

export async function searchTrips(
  sb: SupabaseClient,
  args: { fromCityId: string; toCityId: string; date: string }
): Promise<SearchedTrip[]> {
  console.log("[searchTrips] args:", args);

  // Find the route(s) for this from→to pair (typically 1)
  const { data: routes, error: routesErr } = await sb
    .from("routes")
    .select("id")
    .eq("from_city_id", args.fromCityId)
    .eq("to_city_id", args.toCityId);
  console.log("[searchTrips] routes:", routes?.length ?? 0, "error:", routesErr?.message ?? null);
  if (routesErr) throw routesErr;
  if (!routes || routes.length === 0) return [];

  const routeIds = routes.map((r) => r.id);

  const { data: tripRows, error: tripsErr } = await sb
    .from("trips")
    .select(`
      *,
      agency:agencies(*),
      route:routes(*),
      bus_template:bus_templates(*),
      drop_off:dropoffs(*)
    `)
    .in("route_id", routeIds)
    .eq("date", args.date)
    .order("time");
  console.log("[searchTrips] trips:", tripRows?.length ?? 0, "error:", tripsErr?.message ?? null);
  if (tripsErr) throw tripsErr;

  const [{ data: cities }] = await Promise.all([
    sb.from("cities").select("*").in("id", [args.fromCityId, args.toCityId]),
  ]);
  console.log("[searchTrips] cities:", cities?.length ?? 0);

  const cityMap = new Map((cities ?? []).map((c) => [c.id, c]));
  const fromRow = cityMap.get(args.fromCityId);
  const toRow = cityMap.get(args.toCityId);
  if (!fromRow || !toRow) return [];

  const fromCity = rowToCity(fromRow);
  const toCity = rowToCity(toRow);

  return (tripRows ?? []).map((r) => {
    const trip = rowToTrip(r);
    const totalSeats = (() => {
      const layout = r.bus_template?.layout ?? [];
      return layout
        .flat()
        .filter((c: unknown) => c && c !== "driver").length;
    })();
    const seatsLeft = totalSeats - (trip.takenSeats?.length ?? 0);
    const ratio = totalSeats === 0 ? 0 : seatsLeft / totalSeats;
    const availabilityLabel: SearchedTrip["availabilityLabel"] =
      ratio < 0.15 ? "Almost full" : ratio < 0.4 ? "Fast filling" : "Available";

    return {
      ...trip,
      seatsLeft,
      total: totalSeats,
      availabilityLabel,
      agency: rowToAgency(r.agency),
      fromCity,
      toCity,
      busTemplate: rowToBusTemplate(r.bus_template),
      dropOff: r.drop_off ? rowToDropOff(r.drop_off) : undefined,
    } as SearchedTrip;
  });
}

// ---- Single ticket lookup ----

export async function fetchTicket(
  sb: SupabaseClient,
  consignment: string
) {
  const { data, error } = await sb
    .from("bookings")
    .select(`
      *,
      trip:trips(
        *,
        agency:agencies(*),
        route:routes(
          *,
          from_city:cities!routes_from_city_id_fkey(*),
          to_city:cities!routes_to_city_id_fkey(*)
        ),
        drop_off:dropoffs(*)
      )
    `)
    .eq("consignment", consignment)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return data;
}

// ---- Mutations (admin client only) ----

export async function insertBooking(
  sb: SupabaseClient,
  b: {
    consignment: string;
    tripId: string;
    passengerName: string;
    passengerPhone: string;
    passengerEmail?: string;
    seat: string;
    seatClass: "VIP" | "Regular";
    amount: number;
    paymentMethod: "MTN" | "ORANGE";
    paymentTransId?: string;
    dropOff?: string;
  }
) {
  const { data, error } = await sb
    .from("bookings")
    .insert({
      consignment: b.consignment,
      trip_id: b.tripId,
      passenger_name: b.passengerName,
      passenger_phone: b.passengerPhone,
      passenger_email: b.passengerEmail ?? null,
      seat: b.seat,
      seat_class: b.seatClass,
      amount: b.amount,
      payment_method: b.paymentMethod,
      payment_trans_id: b.paymentTransId ?? null,
      drop_off: b.dropOff ?? null,
      status: "valid",
    })
    .select()
    .single();
  if (error) throw error;

  // Append seat to trips.taken_seats atomically.
  const { data: trip, error: tripErr } = await sb
    .from("trips")
    .select("taken_seats")
    .eq("id", b.tripId)
    .single();
  if (tripErr) throw tripErr;

  const nextSeats = Array.from(
    new Set([...(trip?.taken_seats ?? []), b.seat])
  );
  const { error: updErr } = await sb
    .from("trips")
    .update({ taken_seats: nextSeats })
    .eq("id", b.tripId);
  if (updErr) throw updErr;

  // Audit event for the dashboard feed
  await sb.from("events").insert({
    kind: "booking.created",
    ref_id: b.consignment,
    payload: {
      amount: b.amount,
      seat: b.seat,
      paymentMethod: b.paymentMethod,
    },
  });

  return rowToBooking(data);
}

export async function upsertPaymentRecord(
  sb: SupabaseClient,
  args: {
    transId: string;
    externalId: string;
    amount: number;
    status: "PENDING" | "SUCCESSFUL" | "FAILED" | "EXPIRED";
    medium?: string;
    payerPhone?: string;
    payerName?: string;
    email?: string;
    message?: string;
    raw?: unknown;
  }
) {
  const { error } = await sb.from("payments").upsert(
    {
      trans_id: args.transId,
      external_id: args.externalId,
      amount: args.amount,
      status: args.status,
      medium: args.medium ?? null,
      payer_phone: args.payerPhone ?? null,
      payer_name: args.payerName ?? null,
      email: args.email ?? null,
      message: args.message ?? null,
      date_confirmed:
        args.status === "PENDING" ? null : new Date().toISOString(),
      raw: args.raw ?? null,
    },
    { onConflict: "trans_id" }
  );
  if (error) throw error;
}
