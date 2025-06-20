import { db } from "@/lib/db/client";
import {
  marketConditionsTable,
  marketsTable,
  userActivityTable,
} from "@/lib/db/schema";
import { db as userDb } from "@/lib/userDB/client";
import { usersTable } from "@/lib/userDB/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");

  const search = user ? eq(userActivityTable.user, user) : undefined;

  const activities = await db
    .select()
    .from(userActivityTable)
    .innerJoin(marketsTable, eq(userActivityTable.marketId, marketsTable.id))
    .leftJoin(
      marketConditionsTable,
      eq(marketsTable.id, marketConditionsTable.marketId)
    )
    .where(search)
    .orderBy(desc(userActivityTable.createdAt));

  const userMap = activities.reduce((acc, ac) => {
    if (!acc.includes(ac.user_activity.user)) {
      acc.push(ac.user_activity.user);
    }
    return acc;
  }, [] as string[]);

  const userData = await userDb
    .select()
    .from(usersTable)
    .where(inArray(usersTable.proxyWallet, userMap));

  const activitiesMapped = activities.map((ac) => {
    const user = userData.find((u) => u.proxyWallet === ac.user_activity.user);
    const image =
      ac.market_conditions?.type === "sports"
        ? (ac.market_conditions.data as any)?.home_team_logo
        : ac.markets.image;
    const description = ac.markets.description;
    const yesLabel =
      ac.market_conditions?.type === "sports"
        ? ((ac.market_conditions.data as any)?.home_team_short_name as string)
        : "Yes";
    const noLabel =
      ac.market_conditions?.type === "sports"
        ? ((ac.market_conditions.data as any)?.away_team_short_name as string)
        : "No";

    let outcome = null;
    if (ac.user_activity.outcomeValue !== null) {
      outcome = ac.user_activity.outcomeValue ? yesLabel : noLabel;
    }
    const market = {
      id: ac.markets.id,
      league: ac.market_conditions?.type === "sports" ? (ac.market_conditions.data as any)?.league_abbreviation : null,
      description,
      image,
      pricePerShare: ac.user_activity.pricePerShare,
      outcome,
      noLabel,
      yesLabel,
      shares: Number(ac.user_activity.shares) / Math.pow(10, 6),
    };

    const details = {
      amount:
        (Number(ac.user_activity.shares) / Math.pow(10, 6)) *
        Number(ac.user_activity.pricePerShare),
      date: ac.user_activity.createdAt,
      transactionHash: ac.user_activity.transactionHash,
    };

    const u = {
      username: user?.username,
      avatar: user?.avatar,
      proxyWallet: user?.proxyWallet,
    };
    return {
      type: ac.user_activity.activityType,
      market,
      details,
      user: u,
      txHash: ac.user_activity.transactionHash,
    };
  });

  const seen = new Set();
  const uniqueActivities = activitiesMapped.filter(activity => {
    const txHash = activity.txHash;
    // If we've seen this transaction hash before, filter it out
    // Otherwise, add it to our set and keep it
    if (seen.has(txHash)) {
      return false;
    } else {
      seen.add(txHash);
      return true;
    }
  })  

  return NextResponse.json(uniqueActivities);
}
