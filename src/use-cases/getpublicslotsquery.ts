// ---------------------------------------------------------------------------
// GetPublicSlotsQuery
//
// Responsabilidade: buscar no banco os dados necessários para calcular os
// horários disponíveis de um barbeiro em uma data específica.
//
// PRIVACIDADE: Esta query usa `select` explícito no Prisma.
// Apenas startTime e endTime dos agendamentos são retornados.
// Dados do cliente (nome, telefone, clientId) NUNCA são incluídos —
// nem na query, nem na response. Qualquer dev que editar esta função
// deve manter essa garantia.
// ---------------------------------------------------------------------------

import type { WorkingDay } from "@/domain/entities/appointment";
import type { AppResult } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/infra/db/prisma";

// ---------------------------------------------------------------------------
// Tipos de entrada/saída
// ---------------------------------------------------------------------------

export interface GetPublicSlotsInput {
  shopAlias: string;  // alias público da barbearia (ex: "barber-shop")
  barberId: string;   // id do barbeiro selecionado
  serviceId: string;  // id do serviço selecionado (usado para buscar duração)
  date: string;       // "YYYY-MM-DD"
}

export interface PublicSlotsData {
  barber: { id: string; name: string };
  service: { id: string; name: string; durationMinutes: number; price: number };
  workingHours: WorkingDay[];
  // PRIVACIDADE: apenas os horários de início/fim — sem referência ao cliente
  blockedSlots: { startTime: string; endTime: string }[];
}

// ---------------------------------------------------------------------------
// Query principal
// ---------------------------------------------------------------------------

export async function getPublicSlotsQuery(
  input: GetPublicSlotsInput
): Promise<AppResult<PublicSlotsData>> {
  const { shopAlias, barberId, serviceId, date } = input;
  const prisma = getPrisma();

  try {
    // Verifica que a barbearia existe e está acessível pelo alias público
    const shop = await prisma.shop.findUnique({
      where: { alias: shopAlias },
      select: { id: true },
    });

    if (!shop) {
      return err({ type: "SHOP_NOT_FOUND", message: `Barbearia '${shopAlias}' não encontrada.` });
    }

    // Verifica que o barbeiro pertence à barbearia e está ativo
    const barber = await prisma.barber.findFirst({
      where: { id: barberId, shopId: shop.id, active: true },
      select: { id: true, name: true },
    });

    if (!barber) {
      return err({ type: "BARBER_NOT_FOUND", message: "Barbeiro não encontrado ou inativo." });
    }

    // Busca o serviço para obter a duração (necessária para gerar os slots)
    const service = await prisma.service.findFirst({
      where: { id: serviceId, shopId: shop.id, active: true },
      select: { id: true, name: true, durationMinutes: true, price: true },
    });

    if (!service) {
      return err({ type: "SERVICE_NOT_FOUND", message: "Serviço não encontrado ou inativo." });
    }

    // Busca todos os expedientes do barbeiro (todos os dias da semana)
    // O use case listAvailableSlots filtra pelo dayOfWeek da data informada
    const rawWorkingHours = await prisma.workingHours.findMany({
      where: { barberId, shopId: shop.id },
      select: {
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        breakStart: true,
        breakEnd: true,
      },
    });

    const workingHours: WorkingDay[] = rawWorkingHours.map((wh) => ({
      dayOfWeek: wh.dayOfWeek,
      startTime: wh.startTime,
      endTime: wh.endTime,
      breakStart: wh.breakStart ?? undefined,
      breakEnd: wh.breakEnd ?? undefined,
    }));

    // PRIVACIDADE: busca apenas startTime e endTime dos agendamentos confirmados.
    // O select explícito garante que dados do cliente nunca chegam aqui.
    // Status "cancelled" é excluído pois o slot fica livre novamente.
    const appointments = await prisma.appointment.findMany({
      where: {
        barberId,
        shopId: shop.id,
        date: new Date(date + "T12:00:00Z"), // normaliza para evitar problemas de timezone
        status: { notIn: ["cancelled"] },
      },
      select: {
        startTime: true,
        endTime: true,
        // NÃO incluir: clientId, client, observation, totalPrice
      },
    });

    return ok({
      barber,
      service: {
        ...service,
        price: Number(service.price), // converte Decimal do Prisma para number
      },
      workingHours,
      blockedSlots: appointments,
    });
  } catch (error) {
    // Log estruturado para facilitar diagnóstico em produção
    logger.error({
      event: "get_public_slots_query_failed",
      shopAlias,
      barberId,
      serviceId,
      date,
      reason: error instanceof Error ? error.message : "unknown",
    });

    return err({ type: "DATABASE_ERROR", message: "Erro ao consultar disponibilidade." });
  }
}
