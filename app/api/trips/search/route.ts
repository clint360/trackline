import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { searchTrips } from "@/lib/supabase/queries";
import { isTripExpired } from "@/lib/utils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const fromCityId = url.searchParams.get("fromCityId");
  const toCityId = url.searchParams.get("toCityId");
  const date = url.searchParams.get("date");

  console.log("[search] called with:", { fromCityId, toCityId, date });

  if (!fromCityId || !toCityId || !date) {
    console.log("[search] missing params");
    return NextResponse.json(
      { error: "fromCityId, toCityId, date are required" },
      { status: 400 }
    );
  }
  if (fromCityId === toCityId) {
    console.log("[search] same city, returning empty");
    return NextResponse.json({ trips: [] });
  }

  const sb = getSupabaseAdmin();
  console.log("[search] supabase admin live:", Boolean(sb));
  if (!sb) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    console.log("[search] calling searchTrips...");
    const trips = await searchTrips(sb, { fromCityId, toCityId, date });
    const activeTrips = trips.filter((t) => !isTripExpired(t.date, t.time));
    console.log("[search] success, trips count:", trips.length, "active:", activeTrips.length);
    return NextResponse.json(
      { trips: activeTrips },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "search failed";
    console.error("[search] error:", msg, e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
