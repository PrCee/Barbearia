import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hash } from "bcryptjs";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL não configurada");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed...");

  // 1. Criar barbearia
  const shop = await prisma.shop.upsert({
    where: { alias: "barber-shop" },
    update: {},
    create: {
      alias: "barber-shop",
      name: "Barber Shop",
      address: "Av. São Paulo, 123",
      phone: "5519993180893",
      theme: "amber",
    },
  });
  console.log(`✅ Shop: ${shop.name}`);

  // 2. Criar admin (dono)
  const adminPassword = await hash("123456", 10);
  const admin = await prisma.barber.upsert({
    where: { email: "admin@barbershop.com" },
    update: {},
    create: {
      shopId: shop.id,
      name: "Gustavo (Admin)",
      email: "admin@barbershop.com",
      password: adminPassword,
      role: "admin",
      active: true,
    },
  });
  console.log(`✅ Admin: ${admin.email} / senha: 123456`);

  // 3. Criar barbeiros
  const alexPassword = await hash("123456", 10);
  const alex = await prisma.barber.upsert({
    where: { email: "alexandre@barbershop.com" },
    update: {},
    create: {
      shopId: shop.id,
      name: "Alexandre",
      email: "alexandre@barbershop.com",
      password: alexPassword,
      role: "barber",
      active: true,
    },
  });

  const bruno = await prisma.barber.upsert({
    where: { email: "bruno@barbershop.com" },
    update: {},
    create: {
      shopId: shop.id,
      name: "Bruno",
      email: "bruno@barbershop.com",
      password: await hash("123456", 10),
      role: "barber",
      active: true,
    },
  });
  console.log(`✅ Barbeiros: ${alex.name}, ${bruno.name}`);

  // 4. Criar serviços
  const barba = await prisma.service.create({
    data: { shopId: shop.id, name: "Barba", durationMinutes: 30, price: 35 },
  });
  const corte = await prisma.service.create({
    data: { shopId: shop.id, name: "Corte Degradê", durationMinutes: 45, price: 50 },
  });
  const combo = await prisma.service.create({
    data: { shopId: shop.id, name: "Barba + Corte", durationMinutes: 60, price: 75 },
  });
  console.log(`✅ Serviços: ${barba.name}, ${corte.name}, ${combo.name}`);

  // 5. Vincular barbeiros aos serviços
  for (const barberId of [alex.id, bruno.id]) {
    for (const serviceId of [barba.id, corte.id, combo.id]) {
      await prisma.barberService.upsert({
        where: { barberId_serviceId: { barberId, serviceId } },
        update: {},
        create: { barberId, serviceId },
      });
    }
  }
  console.log("✅ Barbeiros vinculados aos serviços");

  // 6. Criar expediente (seg-sex, 08:00-18:00, almoço 12:00-13:00)
  for (const barberId of [alex.id, bruno.id]) {
    for (let day = 1; day <= 5; day++) {
      await prisma.workingHours.create({
        data: {
          shopId: shop.id,
          barberId,
          dayOfWeek: day,
          startTime: "08:00",
          endTime: "18:00",
          breakStart: "12:00",
          breakEnd: "13:00",
        },
      });
    }
  }
  console.log("✅ Expediente configurado (seg-sex, 08:00-18:00)");

  // 7. Criar produtos/extras
  await prisma.product.createMany({
    data: [
      { shopId: shop.id, name: "Pomada", price: 45 },
      { shopId: shop.id, name: "Shampoo", price: 60 },
      { shopId: shop.id, name: "Creme", price: 20 },
    ],
  });
  console.log("✅ Produtos criados");

  console.log("\n🎉 Seed concluído!");
  console.log("📧 Login admin: admin@barbershop.com / 123456");
  console.log("📧 Login barbeiro: alexandre@barbershop.com / 123456");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
