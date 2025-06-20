 
import { eq } from "drizzle-orm"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { cookies } from "next/headers"
import { validateJWT } from "./dynamic/auth-helpers"
import { createUser } from "./dynamic/create-user"
import { db } from "./userDB/client"
import { usersTable } from "./userDB/schema"
export const secret = process.env.NEXTAUTH_SECRET!

type User = {
  id: string
  name: string
  email: string
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        try {
          const token = credentials?.token as string

          if (typeof token !== "string" || !token) {
            throw new Error("Token is required")
          }

          const jwtPayload = await validateJWT(token)

          if (jwtPayload) {
            const user: User = {
              id: jwtPayload.sub || "",
              name: jwtPayload.username || "",
              email: jwtPayload.email || "",
            }

            const evmWallet =
              jwtPayload.verified_credentials
                ?.filter((cred: any) => cred.chain === "eip155")
                .sort(
                  (a: any, b: any) =>
                    new Date(b.lastSelectedAt).getTime() -
                    new Date(a.lastSelectedAt).getTime()
                )
                .map((cred: any) => cred.address)[0] || null

            const cookieStore = await cookies()
            const referral = cookieStore.get("referral")?.value

            const [dbUser] = await db
              .select({ id: usersTable.id })
              .from(usersTable)
              .where(eq(usersTable.dynamicId, user.id))

            if (!dbUser) {
              await createUser(user.id, referral)
              await cookieStore.delete("referral")
            }

            return { ...user, walletAddress: evmWallet }
          }

          return null
        } catch (e) {
          console.error(e)
          return null
        }
      },
    }),
  ],

  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.walletAddress =
          typeof token.walletAddress === "string" ? token.walletAddress : null
      }
      return session
    },
    async jwt({ token, user }) {
      if (user && "walletAddress" in user) {
        token.walletAddress = user.walletAddress
      }
      return token
    },
    signIn: async ({ user }) => {
      console.log("signIn", user)
      return true
    },
  },
} satisfies NextAuthOptions

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      walletAddress?: string | null
    }
  }

  interface JWT {
    id: string
    walletAddress?: string | null
  }
}
