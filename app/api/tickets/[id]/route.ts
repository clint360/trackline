import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { fetchTicket } from "@/lib/supabase/queries";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const row = await fetchTicket(sb, id);
    if (!row) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    const trip = row.trip;
    const route = trip?.route;
    const fromCity = route?.from_city;
    const toCity = route?.to_city;
    const dropOff =
      row.drop_off ?? trip?.drop_off?.name ?? null;

    return NextResponse.json({
      ticket: {
        consignment: row.consignment,
        fromCode: fromCity?.code,
        toCode: toCity?.code,
        fromName: fromCity?.name,
        toName: toCity?.name,
        passengerName: row.passenger_name,
        passengerEmail: row.passenger_email,
        seat: row.seat,
        seatClass: row.seat_class,
        agencyName: trip?.agency?.name,
        date: trip?.date,
        time: trip?.time,
        amount: row.amount,
        status: row.status,
        dropOff,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "lookup failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
