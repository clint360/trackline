import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  AGENCIES,
  BUS_TEMPLATES,
  CITIES,
  ROUTES,
  SCHEDULES,
  generateTripsForRoute,
  listSeatLabels,
} from "@/lib/mock-data";

/**
 * One-shot seed for the Supabase project. Idempotent — uses upsert and skips
 * trip generation if any trips exist. Call from /dashboard/overview's seed
 * button or directly with `curl -X POST /api/admin/seed`.
 */
export async function POST() {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Supabase not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  try {
    // Cities (with drop-offs)
    const cityRows = CITIES.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      active: c.active,
    }));
    let r = await sb.from("cities").upsert(cityRows);
    if (r.error) throw new Error(`cities: ${r.error.message}`);

    const dropoffRows = CITIES.flatMap((c) =>
      (c.dropOffs ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        city_id: c.id,
      }))
    );
    if (dropoffRows.length) {
      r = await sb.from("dropoffs").upsert(dropoffRows);
      if (r.error) throw new Error(`dropoffs: ${r.error.message}`);
    }

    // Agencies
    r = await sb.from("agencies").upsert(
      AGENCIES.map((a) => ({
        id: a.id,
        name: a.name,
        logo_color: a.logoColor,
        image_url: null,
      }))
    );
    if (r.error) throw new Error(`agencies: ${r.error.message}`);

    // Bus templates
    r = await sb.from("bus_templates").upsert(
      BUS_TEMPLATES.map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        layout: t.layout,
        locked: false,
      }))
    );
    if (r.error) throw new Error(`templates: ${r.error.message}`);

    // Routes
    r = await sb.from("routes").upsert(
      ROUTES.map((rt) => ({
        id: rt.id,
        from_city_id: rt.fromCityId,
        to_city_id: rt.toCityId,
      }))
    );
    if (r.error) throw new Error(`routes: ${r.error.message}`);

    // Schedules
    r = await sb.from("schedules").upsert(
      SCHEDULES.map((s) => ({ id: s.id, time: s.time, label: s.label ?? null }))
    );
    if (r.error) throw new Error(`schedules: ${r.error.message}`);

    // Trips: generate for each route for today + next 13 days, but only if
    // trips table is empty (idempotent — preserves operator edits)
    const { count, error: countErr } = await sb
      .from("trips")
      .select("*", { count: "exact", head: true });
    if (countErr) throw new Error(`trips count: ${countErr.message}`);

    if ((count ?? 0) === 0) {
      const today = new Date();
      const dates: string[] = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
      }
      const tripRows: any[] = [];
      for (const route of ROUTES) {
        const fromCity = CITIES.find((c) => c.id === route.fromCityId)!;
        const toCity = CITIES.find((c) => c.id === route.toCityId)!;
        for (const date of dates) {
          const generated = generateTripsForRoute(fromCity.code, toCity.code, date);
          for (const t of generated) {
            tripRows.push({
              id: t.id,
              agency_id: t.agencyId,
              route_id: t.routeId,
              bus_template_id: t.busTemplateId,
              date: t.date,
              time: t.time,
              price_regular: t.priceRegular,
              price_vip: t.priceVip,
              taken_seats: t.takenSeats ?? [],
              drop_off_id: t.dropOffId ?? null,
            });
          }
        }
      }
      // Chunk to keep payloads small
      for (let i = 0; i < tripRows.length; i += 200) {
        const chunk = tripRows.slice(i, i + 200);
        r = await sb.from("trips").upsert(chunk);
        if (r.error) throw new Error(`trips chunk ${i}: ${r.error.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      cities: CITIES.length,
      dropoffs: dropoffRows.length,
      agencies: AGENCIES.length,
      templates: BUS_TEMPLATES.length,
      routes: ROUTES.length,
      schedules: SCHEDULES.length,
      tripsCreated: (count ?? 0) === 0 ? "fresh seed" : `kept ${count} existing`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "seed failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
