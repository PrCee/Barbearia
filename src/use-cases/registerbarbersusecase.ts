import type { AppResult } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/infra/db/prisma";
import { hash } from "bcryptjs";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface RegisterBarberInput {
  shopId: string;
  name: string;
  email: string;
  password: string;
}

export interface RegisterBarberOutput {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Use Case
// ---------------------------------------------------------------------------

/**
 * Registra um novo barbeiro em uma shop.
 * Hash da senha com bcrypt (saltRounds: 10) antes de persistir.
 * Verifica unicidade do e-mail globalmente (o campo é único no schema).
 */
export async function registerBarberUseCase(
  input: RegisterBarberInput
): Promise<AppResult<RegisterBarberOutput>> {
  const { shopId, name, email, password } = input;

  // ---------------------------------------------------------------------------
  // Validação básica
  // ---------------------------------------------------------------------------

  if (!name.trim()) {
    return err({
      type: "VALIDATION_ERROR",
      message: "Nome é obrigatório.",
      fields: { name: "Informe o nome do barbeiro." },
    });
  }

  if (!email.trim() || !email.includes("@")) {
    return err({
      type: "VALIDATION_ERROR",
      message: "E-mail inválido.",
      fields: { email: "Informe um e-mail válido." },
    });
  }

  if (password.length < 6) {
    return err({
      type: "VALIDATION_ERROR",
      message: "Senha muito curta.",
      fields: { password: "A senha deve ter pelo menos 6 caracteres." },
    });
  }

  // ---------------------------------------------------------------------------
  // Verificação de e-mail duplicado
  // ---------------------------------------------------------------------------

  try {
    const prisma = getPrisma();

    const existing = await prisma.barber.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return err({
        type: "VALIDATION_ERROR",
        message: "E-mail já cadastrado.",
        fields: { email: "Este e-mail já está em uso." },
      });
    }

    // ---------------------------------------------------------------------------
    // Hash de senha e criação
    // ---------------------------------------------------------------------------

    const passwordHash = await hash(password, 10);

    const barber = await prisma.barber.create({
      data: {
        shopId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: passwordHash,
        role: "barber",
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    return ok(barber);
  } catch (error) {
    logger.error({
      event: "registerBarber.error",
      shopId,
      reason: String(error),
    });
    return err({ type: "DATABASE_ERROR", message: "Erro ao cadastrar barbeiro." });
  }
}
