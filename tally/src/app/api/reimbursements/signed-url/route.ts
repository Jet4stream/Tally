import { NextResponse } from "next/server";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url || !url.startsWith("supabase://")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Extract path from supabase://bucket/path
  const path = url.replace(`supabase://${SUPABASE_BUCKET}/`, "");

  const { data, error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .createSignedUrl(path, 60 * 5); // 5 min expiry

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}