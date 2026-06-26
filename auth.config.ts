import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import GitHub from "next-auth/providers/github"

export const authConfig = {
  providers: [
    GitHub({
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  pages: {
    signIn: "/user/signin",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig

export const { auth } = NextAuth(authConfig)
