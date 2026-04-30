import { NextResponse } from "next/server";
import { z } from "zod";
import { generateConsignment } from "@/lib/utils";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { fapshiPaymentStatus } from "@/lib/fapshi";
import { insertBooking, upsertPaymentRecord } from "@/lib/supabase/queries";

const Schema = z.object({
  tripId: z.string().min(1),
  seat: z.string().min(1),
  seatClass: z.enum(["VIP", "Regular"]),
  amount: z.number().int().min(100),
  paymentMethod: z.enum(["MTN", "ORANGE"]),
  passenger: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email().optional(),
  }),
  fromCode: z.string().min(1),
  toCode: z.string().min(1),
  agencyName: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  paymentTransId: z.string().optional(),
  dropOff: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  // Verify the payment actually succeeded with Fapshi before issuing a ticket.
  // This is the server-side guard against a malicious client claiming success.
  if (data.paymentTransId) {
    try {
      const status = await fapshiPaymentStatus(data.paymentTransId);
      // Persist the payment row regardless (audit trail)
      await upsertPaymentRecord(sb, {
        transId: status.transId,
        externalId: status.externalId ?? data.paymentTransId,
        amount: status.amount ?? data.amount,
        status: status.status,
        medium: status.medium,
        payerPhone: status.payerName ? data.passenger.phone : data.passenger.phone,
        payerName: data.passenger.fullName,
        email: data.passenger.email,
        message: status.message,
        raw: status,
      });
      if (status.status !== "SUCCESSFUL") {
        return NextResponse.json(
          { error: `Payment is ${status.status}; ticket not issued.` },
          { status: 402 }
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Payment check failed";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  const consignment = generateConsignment(
    data.fromCode ?? "TRP",
    data.toCode ?? "XXX"
  );

  try {
    const booking = await insertBooking(sb, {
      consignment,
      tripId: data.tripId,
      passengerName: data.passenger.fullName,
      passengerPhone: data.passenger.phone,
      passengerEmail: data.passenger.email,
      seat: data.seat,
      seatClass: data.seatClass,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentTransId: data.paymentTransId,
      dropOff: data.dropOff,
    });

    return NextResponse.json({
      booking: {
        ...booking,
        agencyName: data.agencyName,
        fromCode: data.fromCode,
        toCode: data.toCode,
        date: data.date,
        time: data.time,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "booking insert failed";
    // Common case: seat already taken (unique race) — surface gracefully
    if (/duplicate|unique/i.test(msg)) {
      return NextResponse.json(
        { error: "That seat was just taken. Please pick another." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
