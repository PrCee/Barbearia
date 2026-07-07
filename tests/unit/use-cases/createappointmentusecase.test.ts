import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Testes do CreateAppointmentUseCase — escritos ANTES da implementação (TDD)
//
// O use case recebe dados do agendamento, verifica disponibilidade,
// faz upsert do cliente e cria o Appointment no banco.
//
// Estes testes usam mocks do Prisma para rodar sem banco de dados real.
// ---------------------------------------------------------------------------

// Mock do módulo Prisma — substituído por objeto controlável nos testes
vi.mock("@/infra/db/prisma", () => ({
  getPrisma: vi.fn(),
}));

// Mock do listAvailableSlots — testado separadamente em seu próprio arquivo
vi.mock("@/use-cases/listavailableslotsusecase", () => ({
  listAvailableSlots: vi.fn(),
}));

import { getPrisma } from "@/infra/db/prisma";
import { listAvailableSlots } from "@/use-cases/listavailableslotsusecase";
import { createAppointment } from "@/use-cases/createappointmentusecase";
import { ok, err } from "@/lib/result";

// ---------------------------------------------------------------------------
// Fixtures reutilizáveis
// ---------------------------------------------------------------------------

const BASE_INPUT = {
  shopId: "shop-1",
  barberId: "barber-1",
  serviceId: "service-1",
  date: "2026-07-10",
  startTime: "09:00",
  clientName: "Carlos Silva",
  clientPhone: "19999991234",
};

// Slot disponível retornado pelo listAvailableSlots mockado
const AVAILABLE_SLOT = {
  barberId: "barber-1",
  barberName: "Alexandre",
  serviceId: "service-1",
  serviceName: "Barba",
  date: "2026-07-10",
  startTime: "09:00",
  endTime: "09:30",
  durationMinutes: 30,
  price: 35,
};

// Builder de mock do Prisma — retorna objeto com métodos encadeáveis
function buildPrismaMock(overrides: Record<string, unknown> = {}) {
  return {
    shop: {
      findUnique: vi.fn().mockResolvedValue({ id: "shop-1" }),
    },
    barber: {
      findFirst: vi.fn().mockResolvedValue({ id: "barber-1", name: "Alexandre" }),
    },
    service: {
      findFirst: vi.fn().mockResolvedValue({
        id: "service-1",
        name: "Barba",
        durationMinutes: 30,
        price: 35,
      }),
    },
    workingHours: {
      findMany: vi.fn().mockResolvedValue([
        { dayOfWeek: 5, startTime: "08:00", endTime: "18:00", breakStart: null, breakEnd: null },
      ]),
    },
    appointment: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({
        id: "apt-1",
        shopId: "shop-1",
        barberId: "barber-1",
        serviceId: "service-1",
        clientId: "client-1",
        date: new Date("2026-07-10T12:00:00Z"),
        startTime: "09:00",
        endTime: "09:30",
        status: "confirmed",
        cancelToken: "token-abc-123",
        totalPrice: 35,
        reminderSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    },
    client: {
      upsert: vi.fn().mockResolvedValue({ id: "client-1", name: "Carlos Silva", phone: "19999991234" }),
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe("createAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Caminho feliz ----------------------------------------------------------

  it("cria agendamento com sucesso quando slot está disponível", async () => {
    const prismaMock = buildPrismaMock();
    vi.mocked(getPrisma).mockReturnValue(prismaMock as never);
    vi.mocked(listAvailableSlots).mockReturnValue(ok([AVAILABLE_SLOT]));

    const result = await createAppointment(BASE_INPUT);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.startTime).toBe("09:00");
      expect(result.value.status).toBe("confirmed");
      // cancelToken deve ser gerado
      expect(result.value.cancelToken).toBeDefined();
      expect(typeof result.value.cancelToken).toBe("string");
    }
  });

  it("faz upsert do cliente pelo telefone — reusa cliente existente", async () => {
    const prismaMock = buildPrismaMock();
    vi.mocked(getPrisma).mockReturnValue(prismaMock as never);
    vi.mocked(listAvailableSlots).mockReturnValue(ok([AVAILABLE_SLOT]));

    await createAppointment(BASE_INPUT);

    // upsert deve ser chamado com o telefone como chave de busca
    expect(prismaMock.client.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ shopId_phone: { shopId: "shop-1", phone: "19999991234" } }),
      })
    );
  });

  it("passa o clientId correto para o appointment criado", async () => {
    const prismaMock = buildPrismaMock();
    vi.mocked(getPrisma).mockReturnValue(prismaMock as never);
    vi.mocked(listAvailableSlots).mockReturnValue(ok([AVAILABLE_SLOT]));

    await createAppointment(BASE_INPUT);

    expect(prismaMock.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clientId: "client-1" }),
      })
    );
  });

  // -- Slot indisponível -----------------------------------------------------

  it("retorna SLOT_UNAVAILABLE se o slot não está na grade de disponíveis", async () => {
    const prismaMock = buildPrismaMock();
    vi.mocked(getPrisma).mockReturnValue(prismaMock as never);
    // listAvailableSlots retorna lista SEM o slot 09:00
    vi.mocked(listAvailableSlots).mockReturnValue(ok([]));

    const result = await createAppointment(BASE_INPUT);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("SLOT_UNAVAILABLE");
    }
  });

  // -- Concorrência ----------------------------------------------------------

  it("retorna CONCURRENCY_CONFLICT quando unique constraint é violada no banco", async () => {
    const prismaMock = buildPrismaMock({
      appointment: {
        findMany: vi.fn().mockResolvedValue([]),
        // Simula violação da constraint @@unique([barberId, date, startTime])
        create: vi.fn().mockRejectedValue({ code: "P2002" }),
      },
    });
    vi.mocked(getPrisma).mockReturnValue(prismaMock as never);
    vi.mocked(listAvailableSlots).mockReturnValue(ok([AVAILABLE_SLOT]));

    const result = await createAppointment(BASE_INPUT);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("CONCURRENCY_CONFLICT");
    }
  });

  // -- Entidades não encontradas ---------------------------------------------

  it("retorna SHOP_NOT_FOUND quando a barbearia não existe", async () => {
    const prismaMock = buildPrismaMock({
      shop: { findUnique: vi.fn().mockResolvedValue(null) },
    });
    vi.mocked(getPrisma).mockReturnValue(prismaMock as never);

    const result = await createAppointment(BASE_INPUT);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("SHOP_NOT_FOUND");
    }
  });

  it("retorna BARBER_NOT_FOUND quando o barbeiro não pertence à shop ou está inativo", async () => {
    const prismaMock = buildPrismaMock({
      barber: { findFirst: vi.fn().mockResolvedValue(null) },
    });
    vi.mocked(getPrisma).mockReturnValue(prismaMock as never);

    const result = await createAppointment(BASE_INPUT);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("BARBER_NOT_FOUND");
    }
  });

  it("retorna SERVICE_NOT_FOUND quando o serviço não existe na shop", async () => {
    const prismaMock = buildPrismaMock({
      service: { findFirst: vi.fn().mockResolvedValue(null) },
    });
    vi.mocked(getPrisma).mockReturnValue(prismaMock as never);

    const result = await createAppointment(BASE_INPUT);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("SERVICE_NOT_FOUND");
    }
  });

  // -- Erro de banco inesperado ----------------------------------------------

  it("retorna DATABASE_ERROR em caso de erro inesperado do banco", async () => {
    const prismaMock = buildPrismaMock({
      appointment: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockRejectedValue(new Error("connection timeout")),
      },
    });
    vi.mocked(getPrisma).mockReturnValue(prismaMock as never);
    vi.mocked(listAvailableSlots).mockReturnValue(ok([AVAILABLE_SLOT]));

    const result = await createAppointment(BASE_INPUT);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("DATABASE_ERROR");
    }
  });
});
