import { NextResponse } from "next/server";
import { getAuthenticatedBarber } from "@/lib/session";
import { getPrisma } from "@/infra/db/prisma";
import { updateShopSettingsUseCase } from "@/use-cases/updateshopsettingsusecase";
import { errorToHttpStatus } from "@/domain/errors";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// GET /api/dashboard/shop — retorna dados da shop do barbeiro logado
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const authResult = await getAuthenticatedBarber(request);
  if (authResult.isErr()) {
    return NextResponse.json({ error: authResult.error.message }, { status: 401 });
  }

  const { shopId } = authResult.value;

  try {
    const prisma = getPrisma();
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        theme: true,
        alias: true,
        clubEnabled: true,
      },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop não encontrada." }, { status: 404 });
    }

    return NextResponse.json(shop);
  } catch (error) {
    logger.error({ event: "api.shop.get.error", shopId, reason: String(error) });
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/dashboard/shop — atualiza configurações (somente admin)
// ---------------------------------------------------------------------------

export async function PATCH(request: Request) {
  const authResult = await getAuthenticatedBarber(request);
  if (authResult.isErr()) {
    return NextResponse.json({ error: authResult.error.message }, { status: 401 });
  }

  const { shopId, role } = authResult.value;

  // PRIVACIDADE: somente administradores podem alterar configurações da shop
  if (role !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const result = await updateShopSettingsUseCase({
    shopId,
    name: typeof body.name === "string" ? body.name : undefined,
    address: typeof body.address === "string" ? body.address : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
    theme: typeof body.theme === "string" ? body.theme : undefined,
    clubEnabled: typeof body.clubEnabled === "boolean" ? body.clubEnabled : undefined,
  });

  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: errorToHttpStatus(result.error) }
    );
  }

  return NextResponse.json(result.value);
}
