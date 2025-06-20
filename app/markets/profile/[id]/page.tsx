import { collateralContract } from "@/contracts/data/collateral";
import { db } from "@/lib/db/client";
import { userActivityTable } from "@/lib/db/schema";
import { dynamicClient } from "@/lib/dynamic/client";
import { db as userDB } from "@/lib/userDB/client";
import { usersTable } from "@/lib/userDB/schema";
import { publicClient } from "@/lib/wallet/public-client";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { erc20Abi } from "viem";

import { PublicProfilePage } from "../pages/public-profile";
const BUY_TYPES = ["BUY", "SPLIT"];
const SELL_TYPES = ["SELL", "MERGE"];
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id || !id.startsWith("0x")) {
    return notFound();
  }

  const [dbUser] = await userDB
    .select()
    .from(usersTable)
    .where(eq(usersTable.proxyWallet, id))
    .limit(1);

  if (!dbUser) {
    return notFound();
  }

  const { data } = await dynamicClient.get(
    `/environments/${process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID}/users/${dbUser.dynamicId}`
  );

  const dynamicUser = data.user;
  const user = {
    ...dbUser,
    email: "",
    username: dynamicUser.username,
    bio: (dynamicUser.metadata as Record<string, string>).bio,
    avatar: (dynamicUser.metadata as Record<string, string>).avatar,
  };

  // const markets = await db
  //   .select()
  //   .from(ordersTable)
  //   .where(eq(ordersTable.maker, id));

  // const totalMarketVolume = markets.reduce((acc, market) => {
  //   const marketId = market.marketId;
  //   const accMarket = acc[marketId as string];

  //   if (accMarket) {
  //     acc[marketId as string] = accMarket + Number(market.takerAmount);
  //   } else {
  //     acc[marketId as string] = Number(market.takerAmount);
  //   }

  //   return acc;
  // }, {} as Record<string, number>);

  const userActivity = await db
    .select()
    .from(userActivityTable)
    .where(eq(userActivityTable.user, id));

  console.log({ userActivity });
  const seen = new Set();
  const uniqueUserActivity = userActivity.filter((activity) => {
    const txHash = activity.transactionHash;
    if (seen.has(txHash)) {
      return false;
    } else {
      seen.add(txHash);
      return true;
    }
  });

  const totalMarketVolume = uniqueUserActivity.reduce((acc, activity) => {
    console.log({ activity });
    const pricePerShare = Number(activity.pricePerShare);
    const shares = Number(activity.shares) / Math.pow(10, 6);
    const amount = pricePerShare * shares;
    return acc + amount;
  }, 0);

  const totalMarketReduce = uniqueUserActivity.reduce((acc, activity) => {
    const marketId = activity.marketId;
    const accMarket = acc[marketId as string];
    if (accMarket) {
      acc[marketId as string] = accMarket + 1;
    } else {
      acc[marketId as string] = 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalMarkets = Object.keys(totalMarketReduce).length;

  const userProfitMap: Record<
    string,
    Record<string, { buys: [number, number][]; sells: [number, number][] }>
  > = {};

  for (const entry of uniqueUserActivity) {
    const { user, marketId, tokenId, activityType } = entry;
    const price = Number(entry.pricePerShare);
    const shares = Number(entry.shares) / Math.pow(10, 6);
    const key = `${marketId}-${tokenId}`;

    if (!userProfitMap[user]) userProfitMap[user] = {};
    if (!userProfitMap[user][key])
      userProfitMap[user][key] = { buys: [], sells: [] };

    if (BUY_TYPES.includes(activityType)) {
      userProfitMap[user][key].buys.push([shares, price]);
    } else if (SELL_TYPES.includes(activityType)) {
      userProfitMap[user][key].sells.push([shares, price]);
    }
  }

  const result = Object.entries(userProfitMap).map(([user, tokens]) => {
    let profit = 0;

    for (const { buys, sells } of Object.values(tokens)) {
      const buyQueue = [...buys];

      // eslint-disable-next-line prefer-const
      for (let [sellShares, sellPrice] of sells) {
        while (sellShares > 0 && buyQueue.length > 0) {
          const [buyShares, buyPrice] = buyQueue[0];
          const matched = Math.min(sellShares, buyShares);

          profit += matched * (sellPrice - buyPrice);
          sellShares -= matched;

          if (matched === buyShares) {
            buyQueue.shift();
          } else {
            buyQueue[0][0] = buyShares - matched;
          }
        }
      }
    }

    return { user, profit: Number(profit.toFixed(2)) };
  });


  const balance = await publicClient.readContract({
    abi: erc20Abi,
    functionName: "balanceOf",
    address: collateralContract.address,
    args: [user.proxyWallet as `0x${string}`],
  });

  const userData = {
    imageUrl: user.avatar,
    username: user.username!,
    profileLink: `${process.env.NEXT_PUBLIC_URL_BASE}/markets/profile/${user.proxyWallet}`,
    proxyWallet: user.proxyWallet!,
    bio: user.bio,
    balance: {
      portfolio: Number(balance) / Math.pow(10, 6),
      cash: Number(balance) / Math.pow(10, 6),
    },
    performanceMetrics: [
      {
        description: "Volume traded",
        value: totalMarketVolume,
      },
      {
        description: "Profit/loss",
        value: result[0]?.profit || 0,
      },
      {
        description: "Markets traded",
        value: totalMarkets,
      },
    ],
  };
  return <PublicProfilePage userData={userData} />;
}
