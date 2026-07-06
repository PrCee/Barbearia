import { describe, it, expect } from "vitest";
import {
  listAvailableSlots,
  timeToMinutes,
  minutesToTime,
  isInBreak,
  isBlocked,
  isValidTimeRange,
  generateSlotsForService,
} from "@/use-cases/listavailableslotsusecase";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

describe("timeToMinutes", () => {
  it("converte 08:00 para 480 minutos", () => {
    expect(timeToMinutes("08:00")).toBe(480);
  });

  it("converte 14:30 para 870 minutos", () => {
    expect(timeToMinutes("14:30")).toBe(870);
  });

  it("converte 00:00 para 0 minutos", () => {
    expect(timeToMinutes("00:00")).toBe(0);
  });
});

describe("minutesToTime", () => {
  it("converte 480 para 08:00", () => {
    expect(minutesToTime(480)).toBe("08:00");
  });

  it("converte 870 para 14:30", () => {
    expect(minutesToTime(870)).toBe("14:30");
  });

  it("converte 0 para 00:00", () => {
    expect(minutesToTime(0)).toBe("00:00");
  });
});

describe("isValidTimeRange", () => {
  it("08:00-18:00 é válido", () => {
    expect(isValidTimeRange("08:00", "18:00")).toBe(true);
  });

  it("18:00-08:00 é inválido (fim antes do início)", () => {
    expect(isValidTimeRange("18:00", "08:00")).toBe(false);
  });
});

describe("isInBreak", () => {
  it("slot 12:00-12:30 está dentro do break 12:00-13:00", () => {
    expect(isInBreak("12:00", "12:30", "12:00", "13:00")).toBe(true);
  });

  it("slot 11:30-12:00 sobrepõe parcialmente o break 12:00-13:00", () => {
    expect(isInBreak("11:30", "12:00", "12:00", "13:00")).toBe(false);
  });

  it("slot 11:30-12:15 sobrepõe o início do break 12:00-13:00", () => {
    expect(isInBreak("11:30", "12:15", "12:00", "13:00")).toBe(true);
  });

  it("slot 10:00-11:00 está fora do break", () => {
    expect(isInBreak("10:00", "11:00", "12:00", "13:00")).toBe(false);
  });

  it("sem break definido, nunca está em break", () => {
    expect(isInBreak("12:00", "12:30", null, null)).toBe(false);
  });
});

describe("isBlocked", () => {
  const blocked = [
    { startTime: "14:00", endTime: "14:30" },
    { startTime: "15:00", endTime: "15:45" },
  ];

  it("slot 14:00-14:30 está bloqueado (exato)", () => {
    expect(isBlocked("14:00", "14:30", blocked)).toBe(true);
  });

  it("slot 14:15-14:45 sobrepõe bloqueio 14:00-14:30", () => {
    expect(isBlocked("14:15", "14:45", blocked)).toBe(true);
  });

  it("slot 14:30-15:00 NÃO sobrepõe bloqueio 15:00-15:45 (adjacente)", () => {
    expect(isBlocked("14:30", "15:00", blocked)).toBe(false);
  });

  it("slot 10:00-11:00 está livre", () => {
    expect(isBlocked("10:00", "11:00", blocked)).toBe(false);
  });

  it("slot 13:30-14:15 sobrepõe bloqueio 14:00-14:30", () => {
    expect(isBlocked("13:30", "14:15", blocked)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generateSlotsForService
// ---------------------------------------------------------------------------

describe("generateSlotsForService", () => {
  const workingDay = {
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "12:00",
    breakStart: undefined,
    breakEnd: undefined,
  };

  const service = {
    id: "svc1",
    name: "Corte",
    durationMinutes: 60,
    price: 50,
  };

  const barber = { id: "b1", name: "Alexandre" };

  it("gera 8 slots de 60min em expediente 08:00-12:00 sem bloqueios", () => {
    const result = generateSlotsForService({
      workingDay,
      service,
      barber,
      blockedSlots: [],
      date: "2026-07-06",
    });

    // 08:00, 08:30, 09:00, 09:30, 10:00, 10:30, 11:00 = 7 slots (11:30 + 60 = 12:30 > 12:00)
    expect(result.length).toBe(7);
    expect(result[0].startTime).toBe("08:00");
    expect(result[0].endTime).toBe("09:00");
    expect(result[6].startTime).toBe("11:00");
    expect(result[6].endTime).toBe("12:00");
  });

  it("não gera slots que ultrapassam o fim do expediente", () => {
    const result = generateSlotsForService({
      workingDay: { ...workingDay, endTime: "08:45" },
      service,
      barber,
      blockedSlots: [],
      date: "2026-07-06",
    });

    // 08:00 + 60 = 09:00 > 08:45 → 0 slots
    // 08:30 + 60 = 09:30 > 08:45 → 0 slots
    expect(result.length).toBe(0);
  });

  it("remove slots que caem no break", () => {
    const result = generateSlotsForService({
      workingDay: {
        ...workingDay,
        breakStart: "10:00",
        breakEnd: "11:00",
      },
      service: { ...service, durationMinutes: 30 },
      barber,
      blockedSlots: [],
      date: "2026-07-06",
    });

    // Slots de 30min, 08:00-12:00, break 10:00-11:00
    // 08:00, 08:30, 09:00, 09:30 → antes do break
    // 10:00 (break), 10:30 (break) → pulados
    // 11:00, 11:30 → depois do break
    const times = result.map((s) => s.startTime);
    expect(times).not.toContain("10:00");
    expect(times).not.toContain("10:30");
    expect(times).toContain("11:00");
    expect(times).toContain("11:30");
  });

  it("remove slots que conflitam com blockedSlots", () => {
    const result = generateSlotsForService({
      workingDay,
      service: { ...service, durationMinutes: 30 },
      barber,
      blockedSlots: [
        { startTime: "09:00", endTime: "09:30" },
        { startTime: "10:30", endTime: "11:00" },
      ],
      date: "2026-07-06",
    });

    const times = result.map((s) => s.startTime);
    expect(times).not.toContain("09:00"); // bloqueado
    expect(times).not.toContain("10:30"); // bloqueado
    expect(times).toContain("08:00");
    expect(times).toContain("09:30");
  });
});

// ---------------------------------------------------------------------------
// listAvailableSlots (integração)
// ---------------------------------------------------------------------------

describe("listAvailableSlots", () => {
  const barber = { id: "b1", name: "Alexandre" };

  const services = [
    { id: "svc1", name: "Barba", durationMinutes: 30, price: 35 },
    { id: "svc2", name: "Corte", durationMinutes: 60, price: 50 },
  ];

  const workingHours = [
    { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", breakStart: "10:00", breakEnd: "10:30" },
  ];

  it("retorna array vazio para dia sem expediente (domingo)", () => {
    const result = listAvailableSlots({
      workingHours,
      services,
      barber,
      blockedSlots: [],
      date: "2026-07-05", // domingo (dayOfWeek=0)
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
  });

  it("retorna slots para segunda-feira com break e bloqueios", () => {
    const result = listAvailableSlots({
      workingHours,
      services,
      barber,
      blockedSlots: [{ startTime: "08:30", endTime: "09:00" }],
      date: "2026-07-06", // segunda-feira
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const slots = result.value;

      // Nenhum slot pode começar durante o break (10:00-10:30)
      const breakSlots = slots.filter(
        (s) => s.startTime >= "10:00" && s.startTime < "10:30"
      );
      expect(breakSlots).toHaveLength(0);

      // Nenhum slot de Barba (30min) pode começar 08:30 (bloqueado)
      const blockedBarba = slots.filter(
        (s) => s.serviceId === "svc1" && s.startTime === "08:30"
      );
      expect(blockedBarba).toHaveLength(0);

      // Deve ter slots de ambos os serviços
      const barbaSlots = slots.filter((s) => s.serviceId === "svc1");
      const corteSlots = slots.filter((s) => s.serviceId === "svc2");
      expect(barbaSlots.length).toBeGreaterThan(0);
      expect(corteSlots.length).toBeGreaterThan(0);

      // Cada slot deve ter os metadados corretos
      for (const slot of slots) {
        expect(slot.barberId).toBe("b1");
        expect(slot.barberName).toBe("Alexandre");
        expect(slot.date).toBe("2026-07-06");
      }
    }
  });

  it("retorna erro para horário de expediente inválido", () => {
    const result = listAvailableSlots({
      workingHours: [
        { dayOfWeek: 1, startTime: "18:00", endTime: "08:00" },
      ],
      services,
      barber,
      blockedSlots: [],
      date: "2026-07-06",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("INVALID_TIME_RANGE");
    }
  });

  it("todos os slots respeitam a duração do serviço (endTime = startTime + duration)", () => {
    const result = listAvailableSlots({
      workingHours: [
        { dayOfWeek: 1, startTime: "08:00", endTime: "18:00" },
      ],
      services: [{ id: "svc1", name: "Barba", durationMinutes: 30, price: 35 }],
      barber,
      blockedSlots: [],
      date: "2026-07-06",
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      for (const slot of result.value) {
        const startMin = timeToMinutes(slot.startTime);
        const endMin = timeToMinutes(slot.endTime);
        expect(endMin - startMin).toBe(slot.durationMinutes);
      }
    }
  });
});
