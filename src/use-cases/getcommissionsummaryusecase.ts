// ---------------------------------------------------------------------------
// GetCommissionSummaryUseCase
//
// Responsabilidade: calcular o resumo de comissões de um período.
//
// Regra de negócio atual: comissão = 50% do valor do serviço (fixo no MVP).
// Futuramente: percentual configurável por barbeiro.
//
// Admin vê todos os barbeiros; barbeiro vê apenas a própria comissão.
// ---------------------------------------------------------------------------

import type { AppResult } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/infra/db/prisma";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface CommissionEntry {
  barberId: string;
  barberName: string;
  totalAppointments: number;
  grossRevenue: number;   // faturamento bruto (valor dos serviços)
  commission: number;     // 50% do faturamento bruto
}

export interface GetCommissionSummaryInput {
  shopId: string;
  barberId: string;  // id do barbeiro logado
  role: string;      // "admin" ou "barber"
  date: string;      // "YYYY-MM-DD" — resumo do dia
}

// Taxa de comissão fixa no MVP — futuramente configurável por barbeiro
const COMMISSION_RATE = 0.5;

// ---------------------------------------------------------------------------
// Use Case
// ---------------------------------------------------------------------------

export async function getCommissionSummary(
  input: GetCommissionSummaryInput
): Promise<AppResult<CommissionEntry[]>> {
  const { shopId, barberId, role, date } = input;
  const prisma = getPrisma();

  try {
    // Admin vê todos; barbeiro vê só a própria comissão
    const barberFilter = role === "admin" ? {} : { barberId };

    const appointments = await prisma.appointment.findMany({
      where: {
        shopId,
        ...barberFilter,
        date: new Date(date + "T12:00:00Z"),
        status: "completed", // só agendamentos concluídos entram na comissão
      },
      select: {
        totalPrice: true,
        barber: { select: { id: true, name: true } },
      },
    });

    // Agrupa por barbeiro e calcula comissão
    const grouped = new Map<string, CommissionEntry>();

    for (const apt of appointments) {
      const key = apt.barber.id;
      const price = apt.totalPrice ? Number(apt.totalPrice) : 0;

      if (!grouped.has(key)) {
        grouped.set(key, {
          barberId: apt.barber.id,
          barberName: apt.barber.name,
          totalAppointments: 0,
          grossRevenue: 0,
          commission: 0,
        });
      }

      const entry = grouped.get(key)!;
      entry.totalAppointments += 1;
      entry.grossRevenue += price;
      entry.commission = parseFloat((entry.grossRevenue * COMMISSION_RATE).toFixed(2));
    }

    return ok(Array.from(grouped.values()));

  } catch (error) {
    logger.error({
      event: "get_commission_summary_failed",
      shopId, barberId, date,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return err({ type: "DATABASE_ERROR", message: "Erro ao calcular comissões." });
  }
}
