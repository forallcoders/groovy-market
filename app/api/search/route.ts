import { db } from "@/lib/db/client";
import { marketsTable } from "@/lib/db/schema";
import { lower } from "@/lib/userDB/schema";
import { and, eq, isNull, like, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const results = await db
    .select()
    .from(marketsTable)
    .where(
      and(
        like(lower(marketsTable.title), `%${query.toLowerCase()}%`),
        eq(marketsTable.status, "created"),
        or(
          eq(marketsTable.type, "grouped"),
          eq(marketsTable.type, "combined"),
          and(
            eq(marketsTable.type, "single"),
            isNull(marketsTable.parentMarketId)
          )
        )
      )
    )
    .limit(10);
  const activeMarkets = results.filter((market) => market.status === "created");
  const resolvedMarkets = results.filter(
    (market) => market.status === "resolved"
  );
  return NextResponse.json({ activeMarkets, resolvedMarkets });
}

