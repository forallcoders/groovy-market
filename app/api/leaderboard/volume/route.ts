import { getStartDateFromRange } from "@/app/markets/utils/leaderboard"
import { useOrderBook } from "@/hooks/market/use-order-book"
import { db } from "@/lib/db/client"
import { db as userDB } from "@/lib/userDB/client"
import { userActivityTable } from "@/lib/db/schema"
import { usersTable } from "@/lib/userDB/schema"
import { gte, inArray } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get("range") ?? "all"
  const startDate = getStartDateFromRange(range)

  const query = db
    .select({
      user: userActivityTable.user,
      shares: userActivityTable.shares,
      pricePerShare: userActivityTable.pricePerShare,
      createdAt: userActivityTable.createdAt,
    })
    .from(userActivityTable)

  const filteredQuery = startDate
    ? query.where(gte(userActivityTable.createdAt, startDate))
    : query

  const data = await filteredQuery

  const volumeMap: Record<string, number> = {}

  for (const entry of data) {
    const user = entry.user
    const shares = Number(entry.shares) / Math.pow(10, 6)
    const price = Number(entry.pricePerShare)

    const value = shares * price

    volumeMap[user] = (volumeMap[user] ?? 0) + value
  }

  const leaderboard = Object.entries(volumeMap)
    .map(([user, volume]) => ({
      user,
      volume: Number(volume.toFixed(2)),
    }))
    .sort((a, b) => b.volume - a.volume)

  const userAddresses = leaderboard.map((entry) => entry.user)
  const users = await userDB
    .select({
      username: usersTable.username,
      avatar: usersTable.avatar,
      proxyWallet: usersTable.proxyWallet,
    })
    .from(usersTable)
    .where(inArray(usersTable.proxyWallet, userAddresses))

  const userMap = new Map(users.map((user) => [user.proxyWallet, user]))
  const leaderboardWithUsernames = leaderboard.map((entry) => {
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
