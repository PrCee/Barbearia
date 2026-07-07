import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/infra/db/prisma";
import { getTheme } from "@/lib/themes";
import { BarbersClient } from "./barbers-client";

// ---------------------------------------------------------------------------
// Server Component — verifica permissão e carrega tema
// ---------------------------------------------------------------------------

/**
 * Página de gerenciamento de barbeiros.
 * Somente administradores têm acesso.
 */
export default async function BarbersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role?: string; shopId?: string };

  if (user.role !== "admin") redirect("/dashboard");

  const shopId = user.shopId ?? "";

  const prisma = getPrisma();
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { theme: true },
  });

  const theme = getTheme(shop?.theme ?? "noir");

  return <BarbersClient theme={theme} />;
}
