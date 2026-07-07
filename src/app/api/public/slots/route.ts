// ---------------------------------------------------------------------------
// GET /api/public/slots
//
// API pública (sem autenticação) que retorna os horários disponíveis e
// ocupados de um barbeiro para uma data específica.
//
// Query params obrigatórios:
//   shopAlias  — alias público da barbearia (ex: "barber-shop")
//   barberId   — id do barbeiro
//   serviceId  — id do serviço (define a duração do slot)
//   date       — data no formato "YYYY-MM-DD"
//
// PRIVACIDADE: A response retorna apenas { time, endTime, available }.
// Nunca expõe clientId, nome ou telefone de quem agendou.
// Ver getpublicslotsquery.ts para garantia na camada de banco.
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { getPublicSlotsQuery } from "@/use-cases/getpublicslotsquery";
import { listAvailableSlots } from "@/use-cases/listavailableslotsusecase";
import { errorToHttpStatus } from "@/domain/errors";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Tipos da response pública
// ---------------------------------------------------------------------------

// Slot retornado ao cliente — apenas disponibilidade, sem dados pessoais
interface PublicSlotResponse {
  time: string;     // "HH:mm" — horário de início
  endTime: string;  // "HH:mm" — horário de fim
  available: boolean;
}

// ---------------------------------------------------------------------------
// Handler GET
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;

  // Extrai e valida os parâmetros obrigatórios
  const shopAlias = searchParams.get("shopAlias");
  const barberId  = searchParams.get("barberId");
  const serviceId = searchParams.get("serviceId");
  const date      = searchParams.get("date");

  // Validação simples: todos os params são obrigatórios
  if (!shopAlias || !barberId || !serviceId || !date) {
    return NextResponse.json(
      { error: "Parâmetros obrigatórios: shopAlias, barberId, serviceId, date" },
      { status: 400 }
    );
  }

  // Valida o formato da data para evitar queries malformadas
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Formato de data inválido. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  // Busca dados do banco (working hours + blocked slots sem dados do cliente)
  const queryResult = await getPublicSlotsQuery({ shopAlias, barberId, serviceId, date });

  if (queryResult.isErr()) {
    const error = queryResult.error;
    logger.warn({
      event: "public_slots_query_error",
      shopAlias,
      barberId,
      date,
      reason: error.type,
    });
    return NextResponse.json({ error: error.message }, { status: errorToHttpStatus(error) });
  }

  const { barber, service, workingHours, blockedSlots } = queryResult.value;

  // Calcula os slots disponíveis usando o use case existente (já testado)
  const slotsResult = listAvailableSlots({
    workingHours,
    services: [service],
    barber,
    blockedSlots,
    date,
  });

  if (slotsResult.isErr()) {
    return NextResponse.json({ error: slotsResult.error.message }, { status: 500 });
  }

  // Monta a lista completa de horários do expediente com status de disponibilidade.
  // Slots retornados pelo use case = disponíveis; os demais = ocupados.
  const availableTimes = new Set(slotsResult.value.map((s) => s.startTime));

  // Gera todos os horários possíveis do expediente para mostrar os ocupados também.
  // Reutiliza a lógica do use case, mas com blockedSlots vazio (sem bloqueios).
  const allSlotsResult = listAvailableSlots({
    workingHours,
    services: [service],
    barber,
    blockedSlots: [], // sem bloqueios = todos os slots do expediente
    date,
  });

  const allSlots = allSlotsResult.isOk() ? allSlotsResult.value : slotsResult.value;

  // Constrói a response pública: cada slot tem apenas horário e disponibilidade
  const response: PublicSlotResponse[] = allSlots.map((slot) => ({
    time: slot.startTime,
    endTime: slot.endTime,
    available: availableTimes.has(slot.startTime),
  }));

  // Cache de 30 segundos — balanceia freshness com performance no serverless
  return NextResponse.json(response, {
    headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
  });
}
