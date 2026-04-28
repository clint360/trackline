import { NextResponse } from "next/server";
import { generateConsignment } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    fromCode,
    toCode,
    tripId,
    seat,
    seatClass,
    amount,
    paymentMethod,
    passenger,
    agencyName,
    date,
    time,
  } = body ?? {};

  if (!tripId || !seat || !passenger?.fullName) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Simulate processing
  await new Promise((r) => setTimeout(r, 1400));

  const consignment = generateConsignment(fromCode ?? "TRP", toCode ?? "XXX");

  return NextResponse.json({
    booking: {
      consignment,
      tripId,
      passenger,
      seat,
      seatClass,
      amount,
      paymentMethod,
      status: "valid",
      createdAt: new Date().toISOString(),
      agencyName,
      fromCode,
      toCode,
      date,
      time,
    },
  });
}
