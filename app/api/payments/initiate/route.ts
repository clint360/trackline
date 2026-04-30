import { NextResponse } from "next/server";
import { z } from "zod";
import { fapshiDirectPay } from "@/lib/fapshi";

const InitiateSchema = z.object({
  amount: z.number().int().min(100),
  phone: z.string().min(8),
  method: z.enum(["MTN", "ORANGE"]),
  passengerName: z.string().min(2),
  email: z.string().email().optional(),
  externalId: z.string().min(1),
  message: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = InitiateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  try {
    const r = await fapshiDirectPay({
      amount: data.amount,
      phone: data.phone,
      medium: data.method === "MTN" ? "mobile money" : "orange money",
      userName: data.passengerName,
      email: data.email,
      externalId: data.externalId,
      message: data.message ?? `Trackline ticket ${data.externalId}`,
    });
    return NextResponse.json(r);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payment initiation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
