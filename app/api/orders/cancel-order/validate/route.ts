import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { db } from "@/lib/db/client"
import { ordersTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const orderHash = searchParams.get("orderHash")

    if (!orderHash) {
      return NextResponse.json(
        { valid: false, message: "Order hash is required" },
        { status: 400 }
      )
    }

    // Fetch the order from the database
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.orderHash, orderHash))

    if (!order) {
      return NextResponse.json(
        { valid: false, message: "Order not found" },
        { status: 404 }
      )
    }

    // Check if order is already cancelled or filled
    if (order.status === "cancelled") {
      return NextResponse.json(
        { valid: false, message: "Order is already cancelled" },
        { status: 400 }
      )
    }

    if (order.status === "filled") {
      return NextResponse.json(
        { valid: false, message: "Cannot cancel filled order" },
        { status: 400 }
      )
    }

    // Check if order is expired
    if (order.status === "expired") {
      return NextResponse.json(
        { valid: false, message: "Order is already expired" },
        { status: 400 }
      )
    }

    // If we reached here, the order is valid for cancellation
    return NextResponse.json({
      valid: true,
      order,
    })
  } catch (error) {
    console.error("Error validating order cancellation:", error)
    return NextResponse.json(
      {
        valid: false,
        message: "Failed to validate order cancellation",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
