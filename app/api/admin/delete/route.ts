import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const ALLOWED_TABLES = new Set([
  "cities",
  "agencies",
  "bus_templates",
  "routes",
  "schedules",
  "trips",
]);

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
  const table = body?.table;
  const id = body?.id;
  if (!ALLOWED_TABLES.has(table) || !id) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { error } = await sb.from(table).delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
