import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Receives a base64 data URL (or raw binary) for an agency profile image,
 * uploads it to the `agency-images` Storage bucket, and returns the public URL.
 *
 * Expected JSON body: { agencyId: string, dataUrl: string, contentType?: string }
 */
export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { error: "Storage not configured" },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const agencyId: string | undefined = body?.agencyId;
  const dataUrl: string | undefined = body?.dataUrl;
  if (!agencyId || !dataUrl) {
    return NextResponse.json(
      { error: "agencyId and dataUrl are required" },
      { status: 400 }
    );
  }

  // Parse data URL → bytes
  const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl);
  if (!m) {
    return NextResponse.json({ error: "Invalid data URL" }, { status: 400 });
  }
  const contentType = m[1];
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.byteLength > 1.5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Image must be under 1.5 MB" },
      { status: 413 }
    );
  }
  const ext = contentType.split("/")[1]?.split("+")[0] ?? "png";
  const path = `${agencyId}/${Date.now()}.${ext}`;

  const { error: upErr } = await sb.storage
    .from("agency-images")
    .upload(path, bytes, { contentType, upsert: true });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data } = sb.storage.from("agency-images").getPublicUrl(path);

  // Persist on the agency row
  await sb
    .from("agencies")
    .update({ image_url: data.publicUrl })
    .eq("id", agencyId);

  return NextResponse.json({ publicUrl: data.publicUrl });
}
