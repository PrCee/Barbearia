// ---------------------------------------------------------------------------
// Página pública de agendamento — /[alias]
//
// Fluxo em 3 passos:
//   1. Profissional + Serviço + Data
//   2. Horários disponíveis (busca em tempo real via /api/public/slots)
//   3. Confirmação com Nome + WhatsApp
//
// Arquitetura:
//   - BookingPage: Server Component — busca dados da shop no banco
//   - BookingClient: Client Component — gerencia estado do fluxo de agendamento
//   - StepTimeSlots: faz fetch para /api/public/slots ao mudar de passo,
//     exibindo slots livres (clicáveis) e ocupados (desabilitados/visuais diferentes)
//
// PRIVACIDADE: Nenhum dado de clientes é carregado nesta página.
// O Server Component busca apenas shop, barbeiros e serviços.
// Os slots são buscados via API pública que garante anonimização.
// ---------------------------------------------------------------------------

import { notFound } from "next/navigation";
import { getPrisma } from "@/infra/db/prisma";
import { type ThemeConfig, getTheme } from "@/lib/themes";
import BookingClient from "./BookingClient";

// ---------------------------------------------------------------------------
// Tipos compartilhados entre Server e Client
// ---------------------------------------------------------------------------

export interface Professional {
  id: string;
  name: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export interface ShopPublicData {
  alias: string;       // alias público da URL (ex: "barber-shop") — usado na API de slots
  name: string;
  address: string | null;
  phone: string | null;
  theme: string;
  professionals: Professional[];
  services: ServiceItem[];
}

// ---------------------------------------------------------------------------
// Server Component — busca dados reais da barbearia no banco
// ---------------------------------------------------------------------------

export default async function BookingPage({
  params,
}: {
  params: Promise<{ alias: string }>;
}) {
  const { alias } = await params;
  const prisma = getPrisma();

  // Busca a barbearia pelo alias público.
  // select explícito: sem dados sensíveis (sem senhas, sem agendamentos, sem clientes)
  const shop = await prisma.shop.findUnique({
    where: { alias },
    select: {
      name: true,
      address: true,
      phone: true,
      theme: true,
      barbers: {
        where: { active: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      },
      services: {
        where: { active: true },
        select: { id: true, name: true, durationMinutes: true, price: true },
        orderBy: { name: "asc" },
      },
    },
  });

  // Barbearia não encontrada → 404
  if (!shop) {
    notFound();
  }

  const shopData: ShopPublicData = {
    alias,               // passa o alias da URL para uso na API pública de slots
    name: shop.name,
    address: shop.address,
    phone: shop.phone,
    theme: shop.theme,
    professionals: shop.barbers,
    services: shop.services.map((s) => ({
      ...s,
      price: Number(s.price), // converte Decimal do Prisma para number serializável
    })),
  };

  const theme = getTheme(shop.theme);

  return <BookingClient shop={shopData} theme={theme} />;
}
