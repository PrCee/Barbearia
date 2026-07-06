import { NextResponse } from "next/server";
import { getPrisma } from "@/infra/db/prisma";

export async function GET() {
  try {
    const prisma = getPrisma();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
