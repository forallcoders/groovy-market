import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/userDB/client"
import { usersTable } from "@/lib/userDB/schema"
import { eq } from "drizzle-orm"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { proxyWallet } = body

    if (!proxyWallet || typeof proxyWallet !== "string") {
      return new Response("Invalid proxy wallet address", { status: 400 })
    }

    // Update user in database
    await db
      .update(usersTable)
      .set({
        proxyWallet,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, user.id))

    // Return success
    return NextResponse.json({
      success: true,
      message: "Proxy wallet updated successfully",
      proxyWallet,
    })
  } catch (error) {
    console.error("Error updating proxy wallet:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
