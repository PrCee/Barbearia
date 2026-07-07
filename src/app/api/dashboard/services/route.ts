import { NextResponse } from "next/server";
import { getAuthenticatedBarber } from "@/lib/session";
import { getPrisma } from "@/infra/db/prisma";
import { createServiceUseCase } from "@/use-cases/createserviceusecase";
import { errorToHttpStatus } from "@/domain/errors";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// GET /api/dashboard/services — lista serviços da shop
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const authResult = await getAuthenticatedBarber(request);
  if (authResult.isErr()) {
    return NextResponse.json({ error: authResult.error.message }, { status: 401 });
  }

  const { shopId } = authResult.value;

  try {
    const prisma = getPrisma();
    const services = await prisma.service.findMany({
      where: { shopId },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        price: true,
        active: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      services.map((s) => ({ ...s, price: Number(s.price) }))
    );
  } catch (error) {
    logger.error({ event: "api.services.get.error", shopId, reason: String(error) });
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/dashboard/services — cria serviço (somente admin)
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

  const result = await createServiceUseCase({
    shopId,
    name: String(body.name ?? ""),
    durationMinutes: Number(body.durationMinutes ?? 0),
    price: Number(body.price ?? 0),
  });

  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: errorToHttpStatus(result.error) }
    );
  }

  return NextResponse.json(result.value, { status: 201 });
}
