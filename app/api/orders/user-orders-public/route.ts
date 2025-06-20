import { db } from "@/lib/db/client";
import {
  marketConditionsTable,
  marketsTable,
  ordersTable,
} from "@/lib/db/schema";
import { getMarketOrderbookData } from "@/lib/order/orderbook";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get("user");
    if (!user) {
      return NextResponse.json({ error: "User is required" }, { status: 400 });
    }

    const orders = await db
      .select()
      .from(ordersTable)
      .where(
        and(
          eq(sql`lower(${ordersTable.maker})`, user.toLowerCase()),
          or(
            eq(ordersTable.status, "pending"),
            eq(ordersTable.status, "partially_filled")
          )
        )
      )
      .orderBy(ordersTable.created_at);

    const marketIds = orders.reduce((acc, order) => {
      if (!order.marketId) return acc;
      if (!acc.includes(order.marketId)) {
        acc.push(order.marketId);
      }
      return acc;
    }, [] as string[]);

    const marketsData = await db
      .select()
      .from(marketsTable)
      .where(inArray(marketsTable.id, marketIds))
      .rightJoin(
        marketConditionsTable,
        eq(marketsTable.id, marketConditionsTable.marketId)
      );

    const marketsWithPrices = await Promise.all(
      marketIds.map(async (id) => {
        const { yesTokenId } = await getMarketOrderbookData(id);
        return {
          marketId: id,
          yesTokenId,
        };
      })
    );
    const ordersWithMarketData = orders.map((order) => {
      const market: any = marketsData.find(
        (m) => m.markets?.id === order.marketId
      );
      const description =
        market?.market_conditions.type === "sports"
          ? `${market?.market_conditions.data?.home_team_name} vs ${market?.market_conditions.data?.away_team_name}`
          : market?.markets?.title;
      const image =
        market?.market_conditions.type === "sports"
          ? market?.market_conditions.data?.home_team_logo
          : market?.markets?.image;
      const marketWithPrice = marketsWithPrices.find(
        (m) => m.marketId === order.marketId
      );
      const isYesTokenId = marketWithPrice?.yesTokenId === order.tokenId;
      const price = Number(order.takerAmount) / Number(order.makerAmount);
      const shares = Number(order.makerAmount) / Math.pow(10, 6);

      return {
        market: {
          description,
          image: image || "",
        },
        positionDetails: {
          value: isYesTokenId,
          price,
          shares,
        },
        filled: `${Number(order.filledAmount) / Math.pow(10, 6)}/${Number(order.makerAmount) / Math.pow(10, 6)}`,
        total: `${Number(order.takerAmount) / Math.pow(10, 6)}`,
      };
    });
    console.dir(ordersWithMarketData, { depth: Infinity });
    return NextResponse.json({ orders: ordersWithMarketData });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch user orders" },
      { status: 500 }
    );
  }
}
