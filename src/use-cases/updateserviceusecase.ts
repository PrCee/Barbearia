import type { AppResult } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/infra/db/prisma";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface UpdateServiceInput {
  serviceId: string;
  shopId: string;
  name?: string;
  durationMinutes?: number;
  price?: number;
  active?: boolean;
}

export interface UpdateServiceOutput {
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
 * Atualiza um serviço existente.
 * Verifica que o serviço pertence à shop antes de alterar (segurança multi-tenant).
 */
export async function updateServiceUseCase(
  input: UpdateServiceInput
): Promise<AppResult<UpdateServiceOutput>> {
  const { serviceId, shopId, name, durationMinutes, price, active } = input;

  // ---------------------------------------------------------------------------
  // Validação básica
  // ---------------------------------------------------------------------------

  if (name !== undefined && !name.trim()) {
    return err({
      type: "VALIDATION_ERROR",
      message: "Nome não pode estar vazio.",
      fields: { name: "Informe um nome válido." },
    });
  }

  if (durationMinutes !== undefined && (!Number.isInteger(durationMinutes) || durationMinutes <= 0)) {
    return err({
      type: "VALIDATION_ERROR",
      message: "Duração inválida.",
      fields: { durationMinutes: "Deve ser um inteiro positivo em minutos." },
    });
  }

  if (price !== undefined && (typeof price !== "number" || price < 0)) {
    return err({
      type: "VALIDATION_ERROR",
      message: "Preço inválido.",
      fields: { price: "Deve ser um valor numérico não-negativo." },
    });
  }

  const hasAnyField =
    name !== undefined ||
    durationMinutes !== undefined ||
    price !== undefined ||
    active !== undefined;

  if (!hasAnyField) {
    return err({
      type: "VALIDATION_ERROR",
      message: "Nenhum campo enviado.",
      fields: { body: "Envie pelo menos um campo para atualizar." },
    });
  }

  // ---------------------------------------------------------------------------
  // Verificação de propriedade (segurança multi-tenant)
  // ---------------------------------------------------------------------------

  try {
    const prisma = getPrisma();

    const existing = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, shopId: true },
    });

    if (!existing) {
      return err({ type: "SERVICE_NOT_FOUND", message: "Serviço não encontrado." });
    }

    // PRIVACIDADE: impede que admin altere serviços de outra shop
    if (existing.shopId !== shopId) {
      logger.error({
        event: "updateService.forbidden",
        shopId,
        serviceId,
        reason: "service_belongs_to_different_shop",
      });
      return err({ type: "UNAUTHORIZED", message: "Acesso negado." });
    }

    // ---------------------------------------------------------------------------
    // Atualização
    // ---------------------------------------------------------------------------

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(durationMinutes !== undefined && { durationMinutes }),
        ...(price !== undefined && { price }),
        ...(active !== undefined && { active }),
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
      id: updated.id,
      name: updated.name,
      durationMinutes: updated.durationMinutes,
      price: Number(updated.price),
      active: updated.active,
    });
  } catch (error) {
    logger.error({
      event: "updateService.error",
      shopId,
      serviceId,
      reason: String(error),
    });
    return err({ type: "DATABASE_ERROR", message: "Erro ao atualizar serviço." });
  }
}
