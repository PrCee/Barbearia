// ---------------------------------------------------------------------------
// CreateAppointmentUseCase
//
// Responsabilidade: criar um agendamento no banco com todas as validações
// necessárias e proteção contra double-booking.
//
// Fluxo:
//   1. Valida existência de shop, barbeiro e serviço
//   2. Busca working hours e appointments existentes
//   3. Verifica se o slot está disponível (reusa listAvailableSlots)
//   4. Faz upsert do cliente pelo telefone
//   5. Cria o Appointment com cancelToken único
//   6. Trata violação de unique constraint como CONCURRENCY_CONFLICT
//
// A constraint @@unique([barberId, date, startTime]) no schema Prisma é a
// última barreira contra double-booking em cenários de alta concorrência.
// ---------------------------------------------------------------------------

import { randomUUID } from "crypto";
import type { AppResult } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/infra/db/prisma";
import { listAvailableSlots } from "@/use-cases/listavailableslotsusecase";
import type { WorkingDay } from "@/domain/entities/appointment";

// ---------------------------------------------------------------------------
// Tipos de entrada/saída
// ---------------------------------------------------------------------------

export interface CreateAppointmentInput {
  shopId: string;
  barberId: string;
  serviceId: string;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:mm"
  clientName: string;
  clientPhone: string;
}

export interface CreatedAppointment {
  id: string;
  barberId: string;
  serviceId: string;
  clientId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  cancelToken: string;
  totalPrice: number;
}

// ---------------------------------------------------------------------------
// Use Case principal
// ---------------------------------------------------------------------------

export async function createAppointment(
  input: CreateAppointmentInput
): Promise<AppResult<CreatedAppointment>> {
  const { shopId, barberId, serviceId, date, startTime, clientName, clientPhone } = input;
  const prisma = getPrisma();

  try {
    // Valida existência da shop
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true },
    });
    if (!shop) return err({ type: "SHOP_NOT_FOUND", message: "Barbearia não encontrada." });

    // Valida barbeiro ativo pertencente à shop
    const barber = await prisma.barber.findFirst({
      where: { id: barberId, shopId, active: true },
      select: { id: true, name: true },
    });
    if (!barber) return err({ type: "BARBER_NOT_FOUND", message: "Barbeiro não encontrado ou inativo." });

    // Busca serviço ativo da shop
    const service = await prisma.service.findFirst({
      where: { id: serviceId, shopId, active: true },
      select: { id: true, name: true, durationMinutes: true, price: true },
    });
    if (!service) return err({ type: "SERVICE_NOT_FOUND", message: "Serviço não encontrado." });

    // Busca expediente e agendamentos existentes para verificar disponibilidade
    const rawWorkingHours = await prisma.workingHours.findMany({
      where: { barberId, shopId },
      select: { dayOfWeek: true, startTime: true, endTime: true, breakStart: true, breakEnd: true },
    });
    const workingHours: WorkingDay[] = rawWorkingHours.map((wh) => ({
      dayOfWeek: wh.dayOfWeek,
      startTime: wh.startTime,
      endTime: wh.endTime,
      breakStart: wh.breakStart ?? undefined,
      breakEnd: wh.breakEnd ?? undefined,
    }));

    // PRIVACIDADE: busca apenas startTime/endTime dos appointments existentes
    const existingAppointments = await prisma.appointment.findMany({
      where: { barberId, shopId, date: new Date(date + "T12:00:00Z"), status: { notIn: ["cancelled"] } },
      select: { startTime: true, endTime: true },
    });

    // Verifica se o slot solicitado está na grade de horários disponíveis
    const slotsResult = listAvailableSlots({
      workingHours,
      services: [{ ...service, price: Number(service.price) }],
      barber,
      blockedSlots: existingAppointments,
      date,
    });

    if (slotsResult.isErr()) return err(slotsResult.error);

    const isAvailable = slotsResult.value.some((s) => s.startTime === startTime && s.serviceId === serviceId);
    if (!isAvailable) {
      return err({ type: "SLOT_UNAVAILABLE", message: "Este horário não está disponível para o serviço selecionado." });
    }

    const slot = slotsResult.value.find((s) => s.startTime === startTime && s.serviceId === serviceId)!;

    // Upsert do cliente pelo telefone — reusa cadastro existente se já agendou antes
    const client = await prisma.client.upsert({
      where: { shopId_phone: { shopId, phone: clientPhone } },
      update: { name: clientName }, // atualiza nome se mudou
      create: { shopId, name: clientName, phone: clientPhone },
      select: { id: true },
    });

    // Cria o agendamento com cancelToken único para cancelamento sem login
    const cancelToken = randomUUID();

    const appointment = await prisma.appointment.create({
      data: {
        shopId,
        barberId,
        serviceId,
        clientId: client.id,
        date: new Date(date + "T12:00:00Z"),
        startTime,
        endTime: slot.endTime,
        status: "confirmed",
        totalPrice: slot.price,
        cancelToken,
      },
      select: {
        id: true, barberId: true, serviceId: true, clientId: true,
        date: true, startTime: true, endTime: true, status: true,
        cancelToken: true, totalPrice: true,
      },
    });

    return ok({
      ...appointment,
      cancelToken: appointment.cancelToken!,
      totalPrice: Number(appointment.totalPrice),
    });

  } catch (error) {
    // P2002 = violação de unique constraint — double-booking por race condition
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return err({ type: "CONCURRENCY_CONFLICT", message: "Este horário acabou de ser reservado. Por favor, escolha outro." });
    }

    logger.error({
      event: "create_appointment_failed",
      shopId, barberId, serviceId, date, startTime,
      reason: error instanceof Error ? error.message : "unknown",
    });

    return err({ type: "DATABASE_ERROR", message: "Erro ao criar agendamento." });
  }
}
