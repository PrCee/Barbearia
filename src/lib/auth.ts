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
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

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

        if (!barber?.active || !barber.password) return null;

        const valid = await compare(password, barber.password);
        if (!valid) return null;

        return {
          id: barber.id,
          name: barber.name,
          email: barber.email,
          role: barber.role,
          shopId: barber.shopId,
        };
      },
    }),
  ],
});
