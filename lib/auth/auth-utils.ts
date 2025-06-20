import { authOptions } from "@/lib/auth"
import { db } from "@/lib/userDB/client"
import { User, usersTable } from "@/lib/userDB/schema"
import { eq } from "drizzle-orm"
import { getServerSession } from "next-auth"

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions)
    if (!session) {
      return null
    }

    const { user } = session
    if (!user) {
      return null
    }

    const { id } = user

    // Get user from database
    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.dynamicId, id))
      .limit(1)

    if (!dbUser) {
      return null
    }

    // Return authenticated user with address
    return dbUser
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}

/**
 * Get authenticated admin from request
 */
export async function getAuthenticatedAdmin(): Promise<{
  id: string
  walletAddress: string
} | null> {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      console.log("🔴 No active session found")
      return null
    }

    const { id, walletAddress } = session.user // Extract user ID & wallet address
    if (!walletAddress) {
      console.log(`🔴 Admin ${id} has no wallet address`)
      return null
    }

    // Check if the wallet address is in the allowed admin list
    const allowedAddresses = (process.env.ADMIN_ADDRESSES || "")
      .split(",")
      .map((addr) => addr.trim().toLowerCase())

    if (!allowedAddresses.includes(walletAddress.toLowerCase())) {
      console.log(`🔴 Access denied for admin wallet: ${walletAddress}`)
      return null
    }

    console.log(`🟢 Admin authenticated: ${walletAddress}`)

    return { id, walletAddress }
  } catch (error) {
    console.error("🔴 Authentication error:", error)
    return null
  }
}
