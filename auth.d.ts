import { DefaultSession } from "next-auth"
import { AdapterUser } from "@auth/core/adapters"

declare module "next-auth" {
  interface Session {
    user: {
      id:             string
      githubUsername: string
    } & DefaultSession["user"]
  }

  interface User {
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