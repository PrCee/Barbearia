import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBarber } from "@/lib/session";
import { getBarberSchedule } from "@/use-cases/getbarberscheduleusecase";
import { errorToHttpStatus } from "@/domain/errors";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = await getAuthenticatedBarber();
  if (authResult.isErr()) {
    return NextResponse.json({ error: authResult.error.message }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Parâmetro 'date' inválido (use YYYY-MM-DD)." }, { status: 400 });
  }

  const result = await getBarberSchedule({
    shopId: authResult.value.shopId,
    barberId: authResult.value.barberId,
    role: authResult.value.role,
    date,
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: errorToHttpStatus(result.error) });
  }

  return NextResponse.json(result.value);
}
