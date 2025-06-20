import { db } from "@/lib/db/client"
import { ordersTable } from "@/lib/db/schema"
import { and, desc, eq, inArray, or, sql } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET() {
  const currentTimestamp = Math.floor(Date.now() / 1000)

  const dbOrders = await db
    .select()
    .from(ordersTable)
    .where(
      and(
        or(
          eq(ordersTable.status, "pending"),
          eq(ordersTable.status, "partially_filled")
        ),
        sql`CAST(${ordersTable.expiration} AS INTEGER) > 0`,
        sql`CAST(${ordersTable.expiration} AS INTEGER) < ${currentTimestamp}`
      )
    )
    .orderBy(desc(ordersTable.created_at))

  const ordersId = await dbOrders.map((i) => i.id)

  await db
    .update(ordersTable)
    .set({ status: "expired" })
    .where(inArray(ordersTable.id, ordersId))

  // check pending orders

  //   const pendingOrders = await db
  //     .select()
  //     .from(ordersTable)
  //     .where(
  //       or(
  //         eq(ordersTable.status, "pending"),
  //         eq(ordersTable.status, "partially_filled")
  //       )
  //     );

  //   const pendingOrdersHashes = await pendingOrders.map((i) => i.orderHash);

  //   const data = await Promise.all(
  //     pendingOrdersHashes.map(async (i) => {
  //       const data = await publicClient.readContract({
  //         address: ctfExchangeContract.address,
  //         abi: ctfExchangeContract.abi,
  //         functionName: "getOrderStatus",
  //         args: [i],
  //       });
  //       return { data, hash: i };
  //     })
  //   );

  //   console.log(data);

  return NextResponse.json({ message: "Orders checked" }, { status: 200 })
}
