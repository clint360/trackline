import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  rowToAgency,
  rowToBooking,
  rowToBusTemplate,
  rowToCity,
  rowToDropOff,
  rowToRoute,
  rowToSchedule,
  rowToTrip,
} from "@/lib/supabase/mappers";

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

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

  const errs = [cities, dropoffs, agencies, templates, routes, schedules, trips, bookings]
    .map((r) => r.error)
    .filter(Boolean);
  if (errs.length) {
    return NextResponse.json(
      { error: errs.map((e) => e?.message).join("; ") },
      { status: 500 }
    );
  }

  const dropByCity = new Map<string, any[]>();
  for (const d of dropoffs.data ?? []) {
    const arr = dropByCity.get(d.city_id) ?? [];
    arr.push(d);
    dropByCity.set(d.city_id, arr);
  }

  return NextResponse.json({
    cities: (cities.data ?? []).map((c) => rowToCity(c, dropByCity.get(c.id) ?? [])),
    agencies: (agencies.data ?? []).map(rowToAgency),
    busTemplates: (templates.data ?? []).map(rowToBusTemplate),
    routes: (routes.data ?? []).map(rowToRoute),
    schedules: (schedules.data ?? []).map(rowToSchedule),
    trips: (trips.data ?? []).map(rowToTrip),
    bookings: (bookings.data ?? []).map(rowToBooking),
  });
}
