import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedBarber } from "@/lib/session";
import { getPrisma } from "@/infra/db/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authResult = await getAuthenticatedBarber();
  if (authResult.isErr()) {
    return NextResponse.json({ error: authResult.error.message }, { status: 401 });
  }

  const { id: appointmentId } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const { status } = body;
  if (!status || !["completed", "cancelled", "confirmed"].includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const prisma = getPrisma();
  
  try {
    // Busca agendamento verificando se pertence a shop do usuario autenticado
    const appointment = await prisma.appointment.findFirst({
      where: { 
        id: appointmentId,
        shopId: authResult.value.shopId,
        // Se for barbeiro normal, so pode alterar os proprios
        ...(authResult.value.role === "admin" ? {} : { barberId: authResult.value.barberId })
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status }
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
