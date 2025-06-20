import { db } from "@/lib/db/client";
import { marketConditionsTable, marketsTable } from "@/lib/db/schema";
import { and, eq, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const markets = await db
    .select()
    .from(marketsTable)
    .innerJoin(
      marketConditionsTable,
      eq(marketsTable.id, marketConditionsTable.marketId)
    )
    .where(
      and(
        lte(marketConditionsTable.predictionDate, new Date().toISOString()),
        eq(marketsTable.status, "created"),
        eq(marketConditionsTable.type, "crypto")
      )
    );
  console.log(markets.length);
  return NextResponse.json(markets);
}
