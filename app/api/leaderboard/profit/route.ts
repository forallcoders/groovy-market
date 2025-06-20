import { getStartDateFromRange } from "@/app/markets/utils/leaderboard"
import { db } from "@/lib/db/client"
import { db as userDB } from "@/lib/userDB/client"
import { userActivityTable } from "@/lib/db/schema"
import { gte, inArray } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { usersTable } from "@/lib/userDB/schema"

const BUY_TYPES = ["BUY", "SPLIT"]
const SELL_TYPES = ["SELL", "MERGE"]

export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get("range") ?? "all"
  const startDate = getStartDateFromRange(range)

  const query = db
    .select({
      user: userActivityTable.user,
      marketId: userActivityTable.marketId,
      tokenId: userActivityTable.tokenId,
      activityType: userActivityTable.activityType,
      shares: userActivityTable.shares,
      pricePerShare: userActivityTable.pricePerShare,
      createdAt: userActivityTable.createdAt,
    })
    .from(userActivityTable)

  const filteredQuery = startDate
    ? query.where(gte(userActivityTable.createdAt, startDate))
    : query

  const activity = await filteredQuery

  const userProfitMap: Record<
    string,
    Record<string, { buys: [number, number][]; sells: [number, number][] }>
  > = {}

  for (const entry of activity) {
    const { user, marketId, tokenId, activityType } = entry
    const price = Number(entry.pricePerShare)
    const shares = Number(entry.shares) / Math.pow(10, 6)
    const key = `${marketId}-${tokenId}`

    if (!userProfitMap[user]) userProfitMap[user] = {}
    if (!userProfitMap[user][key])
      userProfitMap[user][key] = { buys: [], sells: [] }

    if (BUY_TYPES.includes(activityType)) {
      userProfitMap[user][key].buys.push([shares, price])
    } else if (SELL_TYPES.includes(activityType)) {
      userProfitMap[user][key].sells.push([shares, price])
    }
  }

  const result = Object.entries(userProfitMap).map(([user, tokens]) => {
    let profit = 0

    for (const { buys, sells } of Object.values(tokens)) {
      const buyQueue = [...buys]

      // eslint-disable-next-line prefer-const
      for (let [sellShares, sellPrice] of sells) {
        while (sellShares > 0 && buyQueue.length > 0) {
          const [buyShares, buyPrice] = buyQueue[0]
          const matched = Math.min(sellShares, buyShares)

          profit += matched * (sellPrice - buyPrice)
          sellShares -= matched

          if (matched === buyShares) {
            buyQueue.shift()
          } else {
            buyQueue[0][0] = buyShares - matched
          }
        }
      }
    }

    return { user, profit: Number(profit.toFixed(2)) }
  })

  const sorted = result.sort((a, b) => b.profit - a.profit)

  const userAddresses = sorted.map((entry) => entry.user)
  const users = await userDB
    .select({
      username: usersTable.username,
      avatar: usersTable.avatar,
      proxyWallet: usersTable.proxyWallet,
    })
    .from(usersTable)
    .where(inArray(usersTable.proxyWallet, userAddresses))

  const userMap = new Map(users.map((user) => [user.proxyWallet, user]))
  const leaderboardWithUsernames = sorted.map((entry) => {
    const user = userMap.get(entry.user)
    return {
      ...entry,
      username: user?.username ?? null,
      avatar: user?.avatar ?? null,
      proxyWallet: user?.proxyWallet ?? null,
    }
  })
  const enrichedLeaderboard = leaderboardWithUsernames.filter(
    (entry) => entry.username !== null
  )

  return NextResponse.json(enrichedLeaderboard)
}
