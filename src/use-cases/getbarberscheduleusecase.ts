// ---------------------------------------------------------------------------
// GetBarberScheduleUseCase
//
// Responsabilidade: buscar a agenda do dia de um ou todos os barbeiros.
//
// - role "admin": retorna agenda de todos os barbeiros da shop
// - role "barber": retorna apenas a agenda do barbeiro logado
//
// Retorna dados completos do agendamento incluindo nome do cliente
// (esta rota é protegida por autenticação — somente barbeiro/admin acessa).
// ---------------------------------------------------------------------------

import type { AppResult } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/infra/db/prisma";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface ScheduleAppointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number | null;
  client: { name: string; phone: string };
  service: { name: string; durationMinutes: number };
  barber: { id: string; name: string };
}

export interface GetBarberScheduleInput {
  shopId: string;
  barberId: string;  // id do barbeiro logado
  role: string;      // "admin" ou "barber"
  date: string;      // "YYYY-MM-DD"
}

// ---------------------------------------------------------------------------
// Use Case
// ---------------------------------------------------------------------------

export async function getBarberSchedule(
  input: GetBarberScheduleInput
): Promise<AppResult<ScheduleAppointment[]>> {
  const { shopId, barberId, role, date } = input;
  const prisma = getPrisma();

  try {
    // Admin vê todos os barbeiros; barbeiro vê apenas a própria agenda
    const barberFilter = role === "admin" ? {} : { barberId };

    const appointments = await prisma.appointment.findMany({
      where: {
        shopId,
        ...barberFilter,
        date: new Date(date + "T12:00:00Z"),
        status: { not: "cancelled" },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        totalPrice: true,
        // Dados do cliente — visíveis apenas para barbeiro/admin autenticado
        client: { select: { name: true, phone: true } },
        service: { select: { name: true, durationMinutes: true } },
        barber: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return ok(appointments.map((apt) => ({
      ...apt,
      totalPrice: apt.totalPrice ? Number(apt.totalPrice) : null,
    })));

  } catch (error) {
    logger.error({
      event: "get_barber_schedule_failed",
      shopId, barberId, date,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return err({ type: "DATABASE_ERROR", message: "Erro ao buscar agenda." });
  }
}
