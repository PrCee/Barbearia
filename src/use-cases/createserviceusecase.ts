import type { AppResult } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/infra/db/prisma";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface CreateServiceInput {
  shopId: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export interface CreateServiceOutput {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Use Case
// ---------------------------------------------------------------------------

/**
 * Cria um novo serviço para uma shop.
 * Valida nome, duração e preço antes de persistir.
 */
export async function createServiceUseCase(
  input: CreateServiceInput
): Promise<AppResult<CreateServiceOutput>> {
  const { shopId, name, durationMinutes, price } = input;

  // ---------------------------------------------------------------------------
  // Validação
  // ---------------------------------------------------------------------------

  if (!name.trim()) {
    return err({
      type: "VALIDATION_ERROR",
      message: "Nome do serviço é obrigatório.",
      fields: { name: "Informe o nome do serviço." },
    });
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return err({
      type: "VALIDATION_ERROR",
      message: "Duração inválida.",
      fields: { durationMinutes: "A duração deve ser um número inteiro positivo (em minutos)." },
    });
  }

  if (typeof price !== "number" || price < 0) {
    return err({
      type: "VALIDATION_ERROR",
      message: "Preço inválido.",
      fields: { price: "O preço deve ser um valor numérico não-negativo." },
    });
  }

  // ---------------------------------------------------------------------------
  // Persistência
  // ---------------------------------------------------------------------------

  try {
    const prisma = getPrisma();

    const service = await prisma.service.create({
      data: {
        shopId,
        name: name.trim(),
        durationMinutes,
        price,
        active: true,
      },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        price: true,
        active: true,
      },
    });

    return ok({
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: Number(service.price),
      active: service.active,
    });
  } catch (error) {
    logger.error({
      event: "createService.error",
      shopId,
      reason: String(error),
    });
    return err({ type: "DATABASE_ERROR", message: "Erro ao criar serviço." });
  }
}
