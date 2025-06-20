import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { db } from "@/lib/db/client"
import { ordersTable } from "@/lib/db/schema"
import { and, eq, or } from "drizzle-orm"
import { NextResponse } from "next/server"

/**
 * API endpoint to cancel all active orders for a specific user
 */
export async function POST() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    if (!user.proxyWallet) {
      return NextResponse.json(
        { error: "Proxy wallet is required" },
        { status: 400 }
      )
    }

    // Find all active orders for the user
    const activeOrders = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.maker, user.proxyWallet),
          or(
            eq(ordersTable.status, "pending"),
            eq(ordersTable.status, "partially_filled")
          )
        )
      )

    if (activeOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active orders found to cancel",
        ordersAffected: 0,
      })
    }

    // Begin a transaction to update order statuses and create transaction records
    const result = await db.transaction(async (tx) => {
      // 1. Update all orders to cancelled status
      await tx
        .update(ordersTable)
        .set({
          status: "cancelled",
          updated_at: new Date(),
        })
        .where(
          and(
            eq(ordersTable.maker, user.proxyWallet!),
            or(
              eq(ordersTable.status, "pending"),
              eq(ordersTable.status, "partially_filled")
            )
          )
        )

      return {
        success: true,
        message: `Successfully cancelled ${activeOrders.length} orders`,
        orderHashes: activeOrders.map((order) => order.orderHash),
        ordersAffected: activeOrders.length,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error cancelling user orders:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to cancel orders",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
