import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Replaces the drop-off set for a city. Drop-offs are nested under City in
 * the UI; on the backend they're a separate table. We diff:
 *   - upsert any drop-off whose id exists
 *   - insert any whose id doesn't exist
 *   - delete any drop-off rows for this city that aren't in the new list
 */
export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const cityId: string | undefined = body?.cityId;
  const dropOffs: { id: string; name: string }[] = body?.dropOffs ?? [];
  if (!cityId) {
    return NextResponse.json({ error: "cityId required" }, { status: 400 });
  }

  const incomingIds = dropOffs.map((d) => d.id);

  // Delete any rows for this city that aren't in the incoming list
  if (incomingIds.length === 0) {
    const { error } = await sb
      .from("dropoffs")
      .delete()
      .eq("city_id", cityId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const del = await sb
    .from("dropoffs")
    .delete()
    .eq("city_id", cityId)
    .not("id", "in", `(${incomingIds.map((i) => `"${i}"`).join(",")})`);
  if (del.error) {
    return NextResponse.json({ error: del.error.message }, { status: 400 });
  }

  const up = await sb.from("dropoffs").upsert(
    dropOffs.map((d) => ({ id: d.id, name: d.name, city_id: cityId }))
  );
  if (up.error) {
    return NextResponse.json({ error: up.error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
