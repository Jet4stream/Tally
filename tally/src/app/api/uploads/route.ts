import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string; // "receipt" or "generatedPdf"

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "pdf";
  const filePath = `${type}/${randomUUID()}.${ext}`;

  const bytes = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .upload(filePath, Buffer.from(bytes), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(filePath);

  return NextResponse.json({ url: data.publicUrl });
}