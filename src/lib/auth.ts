import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { getPrisma } from "@/infra/db/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) { console.error("[auth] credenciais vazias"); return null; }

        console.log("[auth] buscando barber:", email);
        const prisma = getPrisma();
        const barber = await prisma.barber.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            shopId: true,
            active: true,
          },
        });
        console.log("[auth] barber encontrado:", !!barber);

        if (!barber?.active || !barber.password) { console.error("[auth] barber inativo ou sem senha"); return null; }

        const valid = await compare(password, barber.password);
        console.log("[auth] senha válida:", valid);
        if (!valid) return null;

        console.log("[auth] login ok:", barber.email);
        return {
          id: barber.id,
          name: barber.name,
          email: barber.email,
          role: barber.role,
          shopId: barber.shopId,
        };
        } catch (err) {
          console.error("[auth] erro:", err);
          return null;
        }
      },
    }),
  ],
});
