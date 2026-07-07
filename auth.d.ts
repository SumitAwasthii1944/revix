import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id:             string
      githubUsername?: string
    } & DefaultSession["user"]
  }

  interface User {
    githubUsername?: string
    githubId?:       string
    username?:       string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubUsername?: string
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    githubUsername?: string
  }
}

declare module "@auth/core/types" {
  interface User {
    githubUsername?: string
    githubId?:       string
    username?:       string
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    githubUsername?: string
    githubId?:       string
    username?:       string
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    githubUsername?: string
    githubId?:       string
    username?:       string
  }
}