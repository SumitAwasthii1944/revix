import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
    async signIn({ user, account, profile }: any) {
      if (account?.provider !== "github" || !user?.id) return true

      const githubUsername = profile?.login ?? user.name ?? null

      await prisma.user.upsert({
        where: { id: user.id },
        update: {
          githubId: account.providerAccountId,
          githubUsername,
          username: githubUsername,
        },
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          githubId: account.providerAccountId,
          githubUsername,
          username: githubUsername,
        },
      })

      return true
    }
  },
})