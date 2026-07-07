// ---------------------------------------------------------------------------
// GET /api/public/appointments — POST público para criar agendamento
//
// Recebe os dados do agendamento do cliente final (sem autenticação).
// Chama o CreateAppointmentUseCase que valida disponibilidade e salva no banco.
//
// Body obrigatório:
//   shopAlias, barberId, serviceId, date, startTime, clientName, clientPhone
//
// PRIVACIDADE: a API não retorna dados de outros clientes.
// O cancelToken retornado serve apenas para cancelar este agendamento específico.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/infra/db/prisma";
import { createAppointment } from "@/use-cases/createappointmentusecase";
import { errorToHttpStatus, errorToUserMessage } from "@/domain/errors";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Tipos do body
// ---------------------------------------------------------------------------

interface CreateAppointmentBody {
  shopAlias: string;
  barberId: string;
  serviceId: string;
  date: string;
  startTime: string;
  clientName: string;
  clientPhone: string;
}

// ---------------------------------------------------------------------------
// Handler POST
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: CreateAppointmentBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const { shopAlias, barberId, serviceId, date, startTime, clientName, clientPhone } = body;

  // Valida campos obrigatórios
  if (!shopAlias || !barberId || !serviceId || !date || !startTime || !clientName || !clientPhone) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
  }

  // Valida formato da data
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Formato de data inválido. Use YYYY-MM-DD." }, { status: 400 });
  }

  // Resolve shopAlias → shopId
  const prisma = getPrisma();
  const shop = await prisma.shop.findUnique({
    where: { alias: shopAlias },
    select: { id: true },
  });

  if (!shop) {
    return NextResponse.json({ error: "Barbearia não encontrada." }, { status: 404 });
  }

  // Chama o use case que faz todas as validações e cria o agendamento
  const result = await createAppointment({
    shopId: shop.id,
    barberId,
    serviceId,
    date,
    startTime,
    clientName: clientName.trim(),
    clientPhone: clientPhone.replace(/\D/g, ""), // normaliza telefone removendo formatação
  });

  if (result.isErr()) {
    const error = result.error;
    logger.warn({
      event: "create_appointment_rejected",
      shopAlias, barberId, date, startTime,
      reason: error.type,
    });
    return NextResponse.json(
      { error: errorToUserMessage(error), type: error.type },
      { status: errorToHttpStatus(error) }
    );
  }

  // Retorna dados mínimos — cancelToken para o cliente poder cancelar depois
  const apt = result.value;
  return NextResponse.json({
    id: apt.id,
    startTime: apt.startTime,
    endTime: apt.endTime,
    cancelToken: apt.cancelToken,
    message: "Agendamento criado com sucesso!",
  }, { status: 201 });
}
