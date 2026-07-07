import { NextResponse } from "next/server";
import { getAuthenticatedBarber } from "@/lib/session";
import { updateBarberUseCase } from "@/use-cases/updatebarbersusecase";
import { errorToHttpStatus } from "@/domain/errors";

// ---------------------------------------------------------------------------
// PATCH /api/dashboard/barbers/[id] — edita barbeiro (somente admin)
// ---------------------------------------------------------------------------

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await getAuthenticatedBarber(request);
  if (authResult.isErr()) {
    return NextResponse.json({ error: authResult.error.message }, { status: 401 });
  }

  const { shopId, role } = authResult.value;

  if (role !== "admin") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { id: barberId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const result = await updateBarberUseCase({
    barberId,
    shopId,
    name: typeof body.name === "string" ? body.name : undefined,
    active: typeof body.active === "boolean" ? body.active : undefined,
    imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
  });

  if (result.isErr()) {
    return NextResponse.json(
      { error: result.error.message },
      { status: errorToHttpStatus(result.error) }
    );
  }

  return NextResponse.json(result.value);
}
