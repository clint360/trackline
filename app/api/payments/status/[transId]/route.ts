import { NextResponse } from "next/server";
import { fapshiPaymentStatus } from "@/lib/fapshi";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ transId: string }> }
) {
  const { transId } = await ctx.params;
  if (!transId) {
    return NextResponse.json({ error: "Missing transId" }, { status: 400 });
  }
  try {
    const r = await fapshiPaymentStatus(transId);
    return NextResponse.json(r, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Status check failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
