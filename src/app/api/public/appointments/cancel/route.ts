// ---------------------------------------------------------------------------
// POST /api/public/appointments/cancel
//
// API pública para cancelamento de agendamento via token único.
// Não requer autenticação — o token é a prova de identidade do cliente.
//
// Body: { cancelToken: string }
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { cancelAppointment } from "@/use-cases/cancelappointmentusecase";
import { errorToHttpStatus } from "@/domain/errors";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { cancelToken?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const { cancelToken } = body;

  if (!cancelToken || typeof cancelToken !== "string") {
    return NextResponse.json({ error: "cancelToken é obrigatório." }, { status: 400 });
  }

  const result = await cancelAppointment(cancelToken);

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: errorToHttpStatus(result.error) });
  }

  return NextResponse.json({
    message: "Agendamento cancelado com sucesso.",
    appointment: result.value,
  });
}
