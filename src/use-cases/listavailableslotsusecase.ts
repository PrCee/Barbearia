import type { TimeSlot, WorkingDay } from "@/domain/entities/appointment";
import type { AppError, AppResult } from "@/lib/result";
import { err, ok } from "@/lib/result";

// ---------------------------------------------------------------------------
// Tipos de entrada/saída
// ---------------------------------------------------------------------------

export interface ListAvailableSlotsInput {
  workingHours: WorkingDay[]; // expediente do barbeiro no dia
  services: { id: string; name: string; durationMinutes: number; price: number }[];
  barber: { id: string; name: string };
  blockedSlots: { startTime: string; endTime: string }[]; // appointments já existentes
  date: string; // "YYYY-MM-DD"
}

// ---------------------------------------------------------------------------
// Use Case
// ---------------------------------------------------------------------------

export function listAvailableSlots(input: ListAvailableSlotsInput): AppResult<TimeSlot[]> {
  const { workingHours, services, barber, blockedSlots, date } = input;

  // Extrai dayOfWeek da data
  const dayOfWeek = new Date(date + "T12:00:00").getDay();

  // Encontra o expediente do dia
  const workingDay = workingHours.find((w) => w.dayOfWeek === dayOfWeek);
  if (!workingDay) {
    return ok([]); // Não trabalha nesse dia → zero slots
  }

  // Valida horários
  if (!isValidTimeRange(workingDay.startTime, workingDay.endTime)) {
    return err({ type: "INVALID_TIME_RANGE", message: "Horário de expediente inválido." });
  }

  // Gera todos os slots possíveis para cada serviço
  const slots: TimeSlot[] = [];

  for (const service of services) {
    const serviceSlots = generateSlotsForService({
      workingDay,
      service,
      barber,
      blockedSlots,
      date,
    });
    slots.push(...serviceSlots);
  }

  return ok(slots);
}

// ---------------------------------------------------------------------------
// Funções internas (exportadas para teste)
// ---------------------------------------------------------------------------

interface GenerateSlotsParams {
  workingDay: WorkingDay;
  service: { id: string; name: string; durationMinutes: number; price: number };
  barber: { id: string; name: string };
  blockedSlots: { startTime: string; endTime: string }[];
  date: string;
}

export function generateSlotsForService(params: GenerateSlotsParams): TimeSlot[] {
  const { workingDay, service, barber, blockedSlots, date } = params;

  const slots: TimeSlot[] = [];
  const intervalMinutes = 30; // slots a cada 30 min
  let current = timeToMinutes(workingDay.startTime);
  const dayEnd = timeToMinutes(workingDay.endTime);
  const serviceDuration = service.durationMinutes;

  while (current + serviceDuration <= dayEnd) {
    const slotStart = minutesToTime(current);
    const slotEnd = minutesToTime(current + serviceDuration);

    // Pula se estiver dentro do break
    if (isInBreak(slotStart, slotEnd, workingDay.breakStart, workingDay.breakEnd)) {
      current += intervalMinutes;
      continue;
    }

    // Pula se conflitar com algum blockedSlot
    if (isBlocked(slotStart, slotEnd, blockedSlots)) {
      current += intervalMinutes;
      continue;
    }

    slots.push({
      barberId: barber.id,
      barberName: barber.name,
      serviceId: service.id,
      serviceName: service.name,
      date,
      startTime: slotStart,
      endTime: slotEnd,
      durationMinutes: serviceDuration,
      price: service.price,
    });

    current += intervalMinutes;
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Helpers puros (sem dependências)
// ---------------------------------------------------------------------------

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isInBreak(
  slotStart: string,
  slotEnd: string,
  breakStart?: string | null,
  breakEnd?: string | null
): boolean {
  if (!breakStart || !breakEnd) return false;
  const ss = timeToMinutes(slotStart);
  const se = timeToMinutes(slotEnd);
  const bs = timeToMinutes(breakStart);
  const be = timeToMinutes(breakEnd);
  // Overlap: slot começa antes do fim do break E termina depois do início do break
  return ss < be && se > bs;
}

export function isBlocked(
  slotStart: string,
  slotEnd: string,
  blocked: { startTime: string; endTime: string }[]
): boolean {
  const ss = timeToMinutes(slotStart);
  const se = timeToMinutes(slotEnd);
  return blocked.some((b) => {
    const bs = timeToMinutes(b.startTime);
    const be = timeToMinutes(b.endTime);
    return ss < be && se > bs;
  });
}

export function isValidTimeRange(start: string, end: string): boolean {
  return timeToMinutes(start) < timeToMinutes(end);
}
