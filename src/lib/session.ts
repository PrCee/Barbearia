import { auth } from "@/lib/auth";
import type { AppResult } from "@/lib/result";
import { err, ok } from "@/lib/result";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface AuthenticatedBarber {
  barberId: string;
  shopId: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Helper de autenticação para API routes do dashboard
// ---------------------------------------------------------------------------

/**
 * Obtém o barbeiro autenticado a partir da sessão NextAuth.
 * Lê os cookies automaticamente via auth().
 * Retorna UNAUTHORIZED se não há sessão válida.
 *
 * PRIVACIDADE: Nunca expõe dados do usuário em mensagens de erro públicas.
 */
export async function getAuthenticatedBarber(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request?: Request
): Promise<AppResult<AuthenticatedBarber>> {
  try {
    const session = await auth();

    if (!session?.user) {
      logger.error({ event: "auth.unauthorized", reason: "no_session" });
      return err({ type: "UNAUTHORIZED", message: "Não autenticado." });
    }

    // PRIVACIDADE: session.user contém id, name, email, role, shopId
    // adicionados nos callbacks do auth.config.ts
    const user = session.user as {
      id?: string;
      role?: string;
      shopId?: string;
    };

    if (!user.id || !user.shopId || !user.role) {
      logger.error({
        event: "auth.unauthorized",
        reason: "missing_session_fields",
      });
      return err({ type: "UNAUTHORIZED", message: "Sessão inválida." });
    }

    return ok({
      barberId: user.id,
      shopId: user.shopId,
      role: user.role,
    });
  } catch (error) {
    logger.error({ event: "auth.error", reason: String(error) });
    return err({ type: "UNAUTHORIZED", message: "Erro ao verificar sessão." });
  }
}
