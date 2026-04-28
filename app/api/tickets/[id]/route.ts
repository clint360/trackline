import { NextResponse } from "next/server";
import { seededRandom } from "@/lib/utils";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Parse e.g. TRP-YDE-DLA-1234
  const parts = id.split("-");
  if (parts.length < 4) {
    return NextResponse.json({ error: "Invalid consignment" }, { status: 404 });
  }

  await new Promise((r) => setTimeout(r, 400));
  const rand = seededRandom(id);
  const statuses = ["valid", "used", "cancelled"] as const;
  // bias: 80% valid
  const r = rand();
  const status = r < 0.8 ? "valid" : r < 0.92 ? "used" : "cancelled";

  return NextResponse.json({
    ticket: {
      consignment: id,
      fromCode: parts[1],
      toCode: parts[2],
      passengerName: "Travelling Passenger",
      seat: `${1 + Math.floor(rand() * 8)}${["A", "B", "C", "D"][Math.floor(rand() * 4)]}`,
      seatClass: rand() > 0.5 ? "VIP" : "Regular",
      agencyName: ["Finexs Voyages", "Musango Express", "Vatican Express"][Math.floor(rand() * 3)],
      date: new Date(Date.now() + 86400_000).toISOString().slice(0, 10),
      time: ["06:00", "08:30", "11:00", "14:00", "17:30"][Math.floor(rand() * 5)],
      amount: 4000 + Math.floor(rand() * 9000),
      status,
    },
  });
}
