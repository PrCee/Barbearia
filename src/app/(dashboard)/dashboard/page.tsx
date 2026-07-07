import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTheme } from "@/lib/themes";
import { getPrisma } from "@/infra/db/prisma";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as unknown as { name: string; role: string; shopId: string };
  
  const prisma = getPrisma();
  const shop = await prisma.shop.findUnique({
    where: { id: user.shopId },
    select: { theme: true },
  });
  
  const theme = getTheme(shop?.theme ?? "noir");

  return <DashboardClient theme={theme} userRole={user.role} />;
}
