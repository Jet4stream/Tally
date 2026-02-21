import { prisma } from "@/lib/prisma";

export async function GET() {
  const clubCount = await prisma.club.count();
  return Response.json({ ok: true, clubCount });
}