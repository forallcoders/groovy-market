import { db } from "@/lib/db/client";
import { marketsTable } from "@/lib/db/schema";
import { getMarketChainData } from "@/lib/market/get-markets";
import { and, eq, isNull, not } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const childMarkets = await db
      .select()
      .from(marketsTable)
      .where(
        and(
          eq(marketsTable.status, "created"),
          not(isNull(marketsTable.parentMarketId))
        )
      );

    const childMarketIds = childMarkets.map((market) => market.id);

    await Promise.all(
      childMarkets.map(async (market) => {
        const chainData = await getMarketChainData(market.id);
        await db
          .update(marketsTable)
          .set({
            status: "created",
            conditionId: chainData.conditionId,
            yesTokenId: chainData.yesTokenId,
            noTokenId: chainData.noTokenId,
          })
          .where(eq(marketsTable.id, market.id));
      })
    );

    return NextResponse.json({ childMarketIds });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to publish markets" },
      { status: 500 }
    );
  }
}
