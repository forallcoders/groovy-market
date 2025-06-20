import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/client"
import { marketsTable, priceHistoryTable } from "@/lib/db/schema"
import { and, eq, gte } from "drizzle-orm"

function calculateFidelity(interval: string, marketAgeInDays: number): number {
  const marketAgeInHours = marketAgeInDays * 24
  switch (interval.toLowerCase()) {
    case "1h":
    case "6h":
      return 1
    case "1d":
      return marketAgeInHours < 2 ? 1 : 5
    case "1w":
      if (marketAgeInHours < 6) return 1
      if (marketAgeInDays < 2) return 5
      return 30
    case "1m":
      if (marketAgeInHours < 12) return 1
      if (marketAgeInDays < 3) return 5
      if (marketAgeInDays < 14) return 30
      return 180
    case "all":
    default:
      if (marketAgeInHours < 6) return 1
      if (marketAgeInHours < 24) return 5
      if (marketAgeInDays < 7) return 30
      if (marketAgeInDays < 30) return 180
      return 720
  }
}

export async function GET(request: NextRequest, { params }: any) {
  try {
    const { id: marketId } = await params
    const url = new URL(request.url)
    const interval = url.searchParams.get("interval") || "all"

    const parentMarket = await db.query.marketsTable.findFirst({
      where: eq(marketsTable.id, marketId),
    })
    if (!parentMarket)
      return NextResponse.json({ error: "Market not found" }, { status: 404 })

    const isGrouped = parentMarket.type === "grouped"
    const now = new Date()
    const createdAt = new Date(parentMarket.createdAt)
    const marketAgeInDays =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    const fidelity = calculateFidelity(interval, marketAgeInDays)

    let startTime: Date
    switch (interval.toLowerCase()) {
      case "1h":
        startTime = new Date(now.getTime() - 1 * 60 * 60 * 1000)
        break
      case "6h":
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        break
      case "1d":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case "1w":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "1m":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "all":
      default:
        startTime = createdAt
        break
    }
    if (createdAt > startTime) startTime = createdAt

    const markets = isGrouped
      ? await db.query.marketsTable.findMany({
          where: eq(marketsTable.parentMarketId, parentMarket.id),
        })
      : [parentMarket]

    const rawPoints: {
      t: number
      p: number
      label?: string
      token?: string
    }[] = []

    for (const market of markets) {
      const { id, yesTokenId, noTokenId, title } = market
      if (!yesTokenId) continue

      const nowT = Math.floor(now.getTime() / 1000)

      if (isGrouped) {
        const yesPrices = await db
          .select()
          .from(priceHistoryTable)
          .where(
            and(
              eq(priceHistoryTable.marketId, id),
              eq(priceHistoryTable.tokenId, yesTokenId),
              gte(priceHistoryTable.timestamp, startTime)
            )
          )
          .orderBy(priceHistoryTable.timestamp)

        if (yesPrices.length > 0) {
          for (const entry of yesPrices) {
            rawPoints.push({
              t: Math.floor(new Date(entry.timestamp).getTime() / 1000),
              p: parseFloat(entry.price),
              label: title,
            })
          }
        } else {
          rawPoints.push({ t: nowT, p: 1 / markets.length, label: title })
        }
      } else {
        if (!noTokenId) continue

        const [yesPrices, noPrices] = await Promise.all([
          db
            .select()
            .from(priceHistoryTable)
            .where(
              and(
                eq(priceHistoryTable.marketId, id),
                eq(priceHistoryTable.tokenId, yesTokenId),
                gte(priceHistoryTable.timestamp, startTime)
              )
            )
            .orderBy(priceHistoryTable.timestamp),
          db
            .select()
            .from(priceHistoryTable)
            .where(
              and(
                eq(priceHistoryTable.marketId, id),
                eq(priceHistoryTable.tokenId, noTokenId),
                gte(priceHistoryTable.timestamp, startTime)
              )
            )
            .orderBy(priceHistoryTable.timestamp),
        ])

        const add = (
          entries: typeof yesPrices,
          fallback: number,
          token: "yes" | "no"
        ) => {
          if (entries.length > 0) {
            for (const entry of entries) {
              rawPoints.push({
                t: Math.floor(new Date(entry.timestamp).getTime() / 1000),
                p: parseFloat(entry.price),
                token,
              })
            }
          } else {
            rawPoints.push({ t: nowT, p: fallback, token })
          }
        }

        add(yesPrices, 0.5, "yes")
        add(noPrices, 0.5, "no")
      }
    }

    const grouped: Record<string, typeof rawPoints> = {}
    for (const point of rawPoints) {
      const key = point.label || point.token || "unknown"
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(point)
    }

    const normalizedHistory: typeof rawPoints = []
    const startSeconds = Math.floor(startTime.getTime() / 1000)
    const nowSeconds = Math.floor(now.getTime() / 1000)
    const totalPoints = Math.ceil((nowSeconds - startSeconds) / (fidelity * 60))

    const isSingle = !isGrouped

    for (const key in grouped) {
      const series = grouped[key].sort((a, b) => a.t - b.t)
      let lastKnownPrice = series.length > 0 ? series[0].p : 0.5

      for (let i = 0; i < totalPoints; i++) {
        const targetT = startSeconds + i * fidelity * 60
        const closest = series.reduce(
          (prev, curr) =>
            Math.abs(curr.t - targetT) < Math.abs(prev.t - targetT)
              ? curr
              : prev,
          series[0]
        )
        if (closest && Math.abs(closest.t - targetT) < fidelity * 90) {
          lastKnownPrice = closest.p
        }

        normalizedHistory.push(
          isSingle
            ? { t: targetT, p: lastKnownPrice, token: key }
            : { t: targetT, p: lastKnownPrice, label: key }
        )
      }
    }

    if (isSingle) {
      const yes = normalizedHistory
        .filter((p) => p.token === "yes")
        .map(({ t, p }) => ({ t, p }))
      const no = normalizedHistory
        .filter((p) => p.token === "no")
        .map(({ t, p }) => ({ t, p }))

      return NextResponse.json({
        yes,
        no,
        meta: {
          interval,
          fidelity,
          marketAge: marketAgeInDays.toFixed(1) + " days",
          totalPoints: yes.length + no.length,
        },
      })
    }

    return NextResponse.json({
      history: normalizedHistory.sort((a, b) => a.t - b.t),
      meta: {
        interval,
        fidelity,
        marketAge: marketAgeInDays.toFixed(1) + " days",
        totalPoints: normalizedHistory.length,
      },
    })
  } catch (error) {
    console.error("Error fetching price history:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
