// ---------------------------------------------------------------------------
// CancelAppointmentUseCase
//
// Responsabilidade: cancelar um agendamento via token único.
// Permite que o cliente cancele sem precisar de login.
//
// Regras:
//   - Token deve existir e pertencer a um agendamento "confirmed"
//   - Não é possível cancelar agendamento no passado
//   - Após cancelamento, o slot fica livre para outros clientes
// ---------------------------------------------------------------------------

import type { AppResult } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/infra/db/prisma";

// ---------------------------------------------------------------------------
// Tipos de saída
// ---------------------------------------------------------------------------

export interface CancelledAppointmentInfo {
  startTime: string;
  date: Date;
  barberName: string;
  serviceName: string;
}

// ---------------------------------------------------------------------------
// Use Case
// ---------------------------------------------------------------------------

export async function cancelAppointment(
  cancelToken: string
): Promise<AppResult<CancelledAppointmentInfo>> {
  const prisma = getPrisma();

  try {
    // Busca o agendamento pelo token — sem expor dados do cliente a terceiros
    const appointment = await prisma.appointment.findUnique({
      where: { cancelToken },
      select: {
        id: true,
        status: true,
        date: true,
        startTime: true,
        barber: { select: { name: true } },
        service: { select: { name: true } },
      },
    });

    if (!appointment) {
      return err({ type: "SLOT_UNAVAILABLE", message: "Link de cancelamento inválido ou já utilizado." });
    }

    // Só cancela se ainda estiver confirmado
    if (appointment.status !== "confirmed") {
      return err({ type: "SLOT_UNAVAILABLE", message: "Este agendamento não pode ser cancelado (já concluído ou cancelado)." });
    }

    // Não permite cancelar agendamento que já passou
    const appointmentDate = new Date(appointment.date);
    appointmentDate.setHours(23, 59, 59);
    if (appointmentDate < new Date()) {
      return err({ type: "SLOT_UNAVAILABLE", message: "Não é possível cancelar agendamentos passados." });
    }

    // Realiza o cancelamento
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "cancelled" },
    });

    logger.info({
      event: "appointment_cancelled_by_client",
      appointmentId: appointment.id,
    });

    return ok({
      startTime: appointment.startTime,
      date: appointment.date,
      barberName: appointment.barber.name,
      serviceName: appointment.service.name,
    });

  } catch (error) {
    logger.error({
      event: "cancel_appointment_failed",
      cancelToken,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return err({ type: "DATABASE_ERROR", message: "Erro ao cancelar agendamento." });
  }
}
