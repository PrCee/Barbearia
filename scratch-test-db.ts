import { getPrisma } from "./src/infra/db/prisma";

async function main() {
  try {
    console.log("Iniciando conexão...");
    const prisma = getPrisma();
    console.log("Buscando barbeiros...");
    const barbers = await prisma.barber.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      }
    });
    console.log("Barbeiros encontrados:", barbers);
  } catch (error) {
    console.error("Erro ao conectar no banco:", error);
  }
}

main();
