"use server"

import { eq } from "drizzle-orm"
import { db } from "../userDB/client"
import { usersTable } from "../userDB/schema"

export async function getUserWithProxyAddress(userAddress: string) {
  const [dbUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.proxyWallet, userAddress))
    .limit(1)

  if (!dbUser) {
    return null
  }

  return dbUser
}
