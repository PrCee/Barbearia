import { NextResponse } from "next/server";
import { getAuthenticatedBarber } from "@/lib/session";
import { getPrisma } from "@/infra/db/prisma";
import { registerBarberUseCase } from "@/use-cases/registerbarbersusecase";
import { errorToHttpStatus } from "@/domain/errors";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// GET /api/dashboard/barbers — lista barbeiros da shop
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const authResult = await getAuthenticatedBarber(request);
  if (authResult.isErr()) {
    return NextResponse.json({ error: authResult.error.message }, { status: 401 });
  }

  const { shopId } = authResult.value;

  try {
    const prisma = getPrisma();
    const barbers = await prisma.barber.findMany({
      where: { shopId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        image: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(barbers);
  } catch (error) {
    logger.error({ event: "api.barbers.get.error", shopId, reason: String(error) });
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/dashboard/barbers — cria barbeiro (somente admin)
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const authResult = await getAuthenticatedBarber(request);
  if (authResult.isErr()) {
    return NextResponse.json({ error: authResult.error.message }, { status: 401 });
  }

  const { shopId, role } = authResult.value;

  if (role !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const result = await registerBarberUseCase({
    shopId,
    name: String(body.name ?? ""),
    email: String(body.email ?? ""),
    password: String(body.password ?? ""),
  });

  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: errorToHttpStatus(result.error) }
    );
  }

  return NextResponse.json(result.value, { status: 201 });
}
