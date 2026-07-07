// ---------------------------------------------------------------------------
// Página pública da Barbearia — /[alias]
//
// Esta página é a Landing Page principal, focada em extrema usabilidade.
// Carrega os dados do banco no servidor e passa para LandingClient.
// ---------------------------------------------------------------------------

import { notFound } from "next/navigation";
import { getPrisma } from "@/infra/db/prisma";
import { type ThemeConfig, getTheme } from "@/lib/themes";
import LandingClient from "./LandingClient";

export interface Professional {
  id: string;
  name: string;
  image?: string | null;
}

export interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export interface ShopPublicData {
  alias: string;
  name: string;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  theme: string;
  clubEnabled: boolean;
  professionals: Professional[];
  services: ServiceItem[];
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ alias: string }>;
}) {
  const { alias } = await params;
  const prisma = getPrisma();

  const shop = await prisma.shop.findUnique({
    where: { alias },
    select: {
      name: true,
      address: true,
      phone: true,
      logoUrl: true,
      theme: true,
      clubEnabled: true,
      barbers: {
        where: { active: true },
        select: { id: true, name: true, image: true },
        orderBy: { name: "asc" },
      },
      services: {
        where: { active: true },
        select: { id: true, name: true, durationMinutes: true, price: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!shop) {
    notFound();
  }

  const shopData: ShopPublicData = {
    alias,
    name: shop.name,
    address: shop.address,
    phone: shop.phone,
    logoUrl: shop.logoUrl,
    theme: shop.theme,
    clubEnabled: shop.clubEnabled,
    professionals: shop.barbers,
    services: shop.services.map((s) => ({
      ...s,
      price: Number(s.price),
    })),
  };

  const theme = getTheme(shop.theme);

  return <LandingClient shop={shopData} theme={theme} />;
}
