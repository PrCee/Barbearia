import type { AppResult } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/infra/db/prisma";
import type { ThemeId } from "@/lib/themes";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface UpdateShopSettingsInput {
  shopId: string;
  name?: string;
  address?: string;
  phone?: string;
  theme?: string;
}

export interface UpdateShopSettingsOutput {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  theme: string;
}

// ---------------------------------------------------------------------------
// Constantes de validação
// ---------------------------------------------------------------------------

const VALID_THEMES: ThemeId[] = [
  "noir",
  "midnight",
  "bordeaux",
  "forest",
  "amber",
  "ocean",
  "slate",
  "mono",
];

// ---------------------------------------------------------------------------
// Use Case
// ---------------------------------------------------------------------------

/**
 * Atualiza as configurações da barbearia (nome, endereço, telefone, tema).
 * Somente campos fornecidos são alterados.
 * O tema deve ser um dos 8 temas válidos do sistema.
 */
export async function updateShopSettingsUseCase(
  input: UpdateShopSettingsInput
): Promise<AppResult<UpdateShopSettingsOutput>> {
  const { shopId, name, address, phone, theme } = input;

  // ---------------------------------------------------------------------------
  // Validação: pelo menos um campo deve ser enviado
  // ---------------------------------------------------------------------------

  const hasAnyField =
    name !== undefined ||
    address !== undefined ||
    phone !== undefined ||
    theme !== undefined;

  if (!hasAnyField) {
    return err({
      type: "VALIDATION_ERROR",
      message: "Nenhum campo foi enviado para atualização.",
      fields: { body: "Envie pelo menos um campo." },
    });
  }

  // ---------------------------------------------------------------------------
  // Validação: tema deve ser válido se fornecido
  // ---------------------------------------------------------------------------

  if (theme !== undefined && !VALID_THEMES.includes(theme as ThemeId)) {
    return err({
      type: "VALIDATION_ERROR",
      message: `Tema inválido: ${theme}.`,
      fields: { theme: `Escolha um dos temas: ${VALID_THEMES.join(", ")}.` },
    });
  }

  // ---------------------------------------------------------------------------
  // Persistência
  // ---------------------------------------------------------------------------

  try {
    const prisma = getPrisma();

    const updated = await prisma.shop.update({
      where: { id: shopId },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(theme !== undefined && { theme }),
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        theme: true,
      },
    });

    return ok(updated);
  } catch (error) {
    logger.error({
      event: "updateShopSettings.error",
      shopId,
      reason: String(error),
    });
    return err({ type: "DATABASE_ERROR", message: "Erro ao salvar configurações." });
  }
}
