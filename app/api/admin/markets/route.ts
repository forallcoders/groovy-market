import { getAuthenticatedAdmin } from "@/lib/auth/auth-utils";
import { db } from "@/lib/db/client";
import {
  marketConditionsTable,
  MarketConditionType,
  marketsTable,
} from "@/lib/db/schema";
import { MarketStatus } from "@/types/Market";
import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Admins only" },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "closed";
  const type = url.searchParams.get("type");
  if (!type) {
    return NextResponse.json({ error: "Type is required" }, { status: 400 });
  }
  try {
    const markets = await db
      .select({ market: marketsTable })
      .from(marketsTable)
      .where(
        and(
          eq(marketsTable.status, status as MarketStatus),
          eq(marketConditionsTable.type, type as MarketConditionType)
        )
      )
      .fullJoin(
        marketConditionsTable,
        eq(marketsTable.id, marketConditionsTable.marketId)
      );

    const marketIds = markets.map((m) => m.market!.id);

    const marketConditions =
      marketIds.length > 0
        ? await db
            .select()
            .from(marketConditionsTable)
            .where(inArray(marketConditionsTable.marketId, marketIds))
        : [];

    return NextResponse.json({
      markets: markets.map((m) => m.market),
      marketConditions,
    });
  } catch (error) {
    console.error("Error fetching markets:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}
