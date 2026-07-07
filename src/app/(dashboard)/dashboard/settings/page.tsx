import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/infra/db/prisma";
import { getTheme } from "@/lib/themes";
import { SettingsClient } from "./settings-client";

// ---------------------------------------------------------------------------
// Server Component — carrega dados e verifica permissões
// ---------------------------------------------------------------------------

/**
 * Página de configurações da barbearia.
 * Somente administradores têm acesso — redireciona barbers comuns.
 */
export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as {
    role?: string;
    shopId?: string;
  };

  // Somente admin vê esta página
  if (user.role !== "admin") redirect("/dashboard");

  const shopId = user.shopId ?? "";

  const prisma = getPrisma();
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      theme: true,
      alias: true,
      clubEnabled: true,
    },
  });

  if (!shop) redirect("/dashboard");

  const theme = getTheme(shop.theme);

  return <SettingsClient shop={shop} theme={theme} />;
}
