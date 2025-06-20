import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { db } from "@/lib/db/client"
import { ordersTable, transactionsTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }
    const { orderHash, txHash } = await req.json()

    if (!orderHash) {
      return NextResponse.json(
        { error: "Order hash is required" },
        { status: 400 }
      )
    }

    // Find the order first
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.orderHash, orderHash))

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Begin a transaction to update both order status and create a transaction record
    const result = await db.transaction(async (tx) => {
      // 1. Update the order status to cancelled
      await tx
        .update(ordersTable)
        .set({
          status: "cancelled",
          updated_at: new Date(),
        })
        .where(eq(ordersTable.orderHash, orderHash))

      // 2. Create a transaction record if txHash is provided
      if (txHash) {
        await tx.insert(transactionsTable).values({
          type: "order_cancel",
          status: "success",
          txHash,
          details: {
            orderHash,
            userId: order.maker,
            amount: order.makerAmount,
            tokenId: order.tokenId,
          },
          tokenId: order.tokenId,
          userAddress: order.maker,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }

      return { success: true, order, message: "Order cancelled successfully" }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error cancelling order:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to cancel order",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
