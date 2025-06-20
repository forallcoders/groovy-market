import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { db } from "@/lib/userDB/client"
import { usersTable } from "@/lib/userDB/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = await request.json()
  const { userId } = body

  if (!userId) {
    return new Response("Missing userId", { status: 400 })
  }

  try {
    await db
      .update(usersTable)
      .set({ hasAcceptedTerms: true })
      .where(eq(usersTable.id, userId))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to update terms flag" })
  }
}
