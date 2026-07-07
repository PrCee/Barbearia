import type { AppResult } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/infra/db/prisma";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface UpdateBarberInput {
  barberId: string;
  shopId: string;
  name?: string;
  active?: boolean;
  imageUrl?: string;
}

export interface UpdateBarberOutput {
  id: string;
  name: string;
  active: boolean;
  image: string | null;
}

// ---------------------------------------------------------------------------
// Use Case
// ---------------------------------------------------------------------------

/**
 * Atualiza dados de um barbeiro existente.
 * Verifica que o barbeiro pertence à shop antes de alterar (segurança multi-tenant).
 * Somente campos fornecidos são atualizados.
 */
export async function updateBarberUseCase(
  input: UpdateBarberInput
): Promise<AppResult<UpdateBarberOutput>> {
  const { barberId, shopId, name, active, imageUrl } = input;

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

  const hasAnyField =
    name !== undefined || active !== undefined || imageUrl !== undefined;

  if (!hasAnyField) {
    return err({
      type: "VALIDATION_ERROR",
      message: "Nenhum campo enviado.",
      fields: { body: "Envie pelo menos um campo para atualizar." },
    });
  }

  // ---------------------------------------------------------------------------
  // Verificação de propriedade (segurança: barbeiro pertence à shop)
  // ---------------------------------------------------------------------------

  try {
    const prisma = getPrisma();

    const existing = await prisma.barber.findUnique({
      where: { id: barberId },
      select: { id: true, shopId: true },
    });

    if (!existing) {
      return err({ type: "BARBER_NOT_FOUND", message: "Barbeiro não encontrado." });
    }

    // PRIVACIDADE: impede que um admin altere barbeiros de outra shop
    if (existing.shopId !== shopId) {
      logger.error({
        event: "updateBarber.forbidden",
        shopId,
        barberId,
        reason: "barber_belongs_to_different_shop",
      });
      return err({ type: "UNAUTHORIZED", message: "Acesso negado." });
    }

    // ---------------------------------------------------------------------------
    // Atualização
    // ---------------------------------------------------------------------------

    const updated = await prisma.barber.update({
      where: { id: barberId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(active !== undefined && { active }),
        ...(imageUrl !== undefined && { image: imageUrl }),
      },
      select: {
        id: true,
        name: true,
        active: true,
        image: true,
      },
    });

    return ok(updated);
  } catch (error) {
    logger.error({
      event: "updateBarber.error",
      shopId,
      barberId,
      reason: String(error),
    });
    return err({ type: "DATABASE_ERROR", message: "Erro ao atualizar barbeiro." });
  }
}
