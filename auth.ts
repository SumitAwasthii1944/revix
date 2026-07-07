import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // session: { strategy: "database" },using a jwt strategy
  callbacks: {
    async jwt({ token, user }) {// jwt stores in the browser and used in middleware to check if the user is logged in. 
      //The session callback is used to add additional information to the session object that is returned to the client.
      if (user) {
        token.id = user.id
        token.githubUsername = (user as any).githubUsername ?? ""
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).githubUsername = token.githubUsername ?? ""
      }
      return session
    },
  },
  events: {
    async linkAccount({ user, account, profile }: any) {//Why is this needed? Your Account model already stores providerAccountId, 
      //but that's just a generic field NextAuth uses internally. This event copies that GitHub-specific info onto your actual User row (into the githubId/githubUsername columns you added to your schema), 
      // so you can easily query "give me the user with this GitHub username" directly from the User table without having to join through Account every time.
      if (account?.provider !== "github") return
      await prisma.user.update({
        where: { id: user.id },
        data: {
          githubId:       account.providerAccountId,
          githubUsername: profile?.login,
          username:       profile?.login,
        },
      })
    },
  },
})