/* eslint-disable @typescript-eslint/no-explicit-any */
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/userDB/client"
import { usersTable } from "@/lib/userDB/schema"
import { eq } from "drizzle-orm"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: "No session provided" },
        { status: 401 }
      )
    }
    const { user } = session
    if (!user) {
      return NextResponse.json({ error: "No user provided" }, { status: 401 })
    }
    const { id } = user

    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.dynamicId, id))
      .limit(1)

    if (!dbUser) {
      return NextResponse.json({ error: "No user found" }, { status: 401 })
    }

    return NextResponse.json({ user: dbUser }, { status: 200 })
  } catch (err: any) {
    console.log("session error", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
