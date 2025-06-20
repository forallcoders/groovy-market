"use server"

import { marketCreatorContract } from "@/contracts/data/market-creator"
import { db } from "@/lib/db/client"
import { marketsTable as m, marketConditionsTable as mc } from "@/lib/db/schema"
import { publicClient } from "@/lib/wallet/public-client"
import { and, eq, inArray, isNotNull, isNull, ne, or } from "drizzle-orm"
import { getUserWithProxyAddress } from "../dynamic/avatar"
import { getMarketOrderbookData } from "../order/orderbook"

async function attachCreator<T extends { creatorAddress?: string | null }>(
  mkt: T
): Promise<T & { creator?: any }> {
  if (!mkt.creatorAddress) return mkt
  const creator = await getUserWithProxyAddress(mkt.creatorAddress)
  return creator ? { ...mkt, creator } : mkt
}

export async function getMarketChainData(marketId: string) {
  try {
    const marketData = await publicClient.readContract({
      address: marketCreatorContract.address,
      abi: marketCreatorContract.abi,
      functionName: "getMarketDataByQuestion",
      args: [marketId],
    })
    const [conditionId, yesTokenId, noTokenId] = marketData as any

    return {
      conditionId,
      yesTokenId: yesTokenId.toString(),
      noTokenId: noTokenId.toString(),
    }
  } catch (error) {
    console.warn(`Could not fetch on-chain data for market ${marketId}:`, error)
    return {
      conditionId: null,
      yesTokenId: null,
      noTokenId: null,
    }
  }
}

export async function getMarkets(marketId?: string, league?: string) {
  try {
    const where = [ne(m.status, "pending")]
    if (marketId) where.push(eq(m.id, marketId))

    const isFetchingSingleMarket = Boolean(marketId)

    if (isFetchingSingleMarket) {
      const [market] = await db
        .select({
          id: m.id,
          title: m.title,
          description: m.description,
          volume: m.volume,
          image: m.image,
          endDate: m.endDate,
          parentMarketId: m.parentMarketId,
          type: m.type,
          createdAt: m.createdAt,
          status: m.status,
          creatorAddress: m.creatorAddress,
        })
        .from(m)
        .where(and(eq(m.id, marketId!), eq(m.status,"created")))

      if (!market) return []

      const conditions = await db
        .select({
          conditionId: mc.id,
          marketId: mc.marketId,
          conditionType: mc.type,
          asset: mc.asset,
          metric: mc.metric,
          metricCondition: mc.metricCondition,
          predictionDate: mc.predictionDate,
          apiId: mc.apiId,
          variantKey: mc.variantKey,
          data: mc.data,
        })
        .from(mc)
        .where(eq(mc.marketId, market.id))

      const marketWithConditions = {
        ...market,
        ...conditions[0],
      }

      let relatedMarkets: any[] = []

      if (marketWithConditions.type === "grouped") {
        const childMarkets = await db
          .select({
            id: m.id,
            title: m.title,
            parentMarketId: m.parentMarketId,
            image: m.image,
            conditionType: mc.type,
            asset: mc.asset,
            metric: mc.metric,
            predictionDate: mc.predictionDate,
          })
          .from(m)
          .innerJoin(mc, eq(mc.marketId, m.id))
          .where(eq(m.parentMarketId, marketWithConditions.id))

        const referenceChild = childMarkets[0]

        if (
          referenceChild?.asset &&
          referenceChild?.metric &&
          referenceChild?.predictionDate
        ) {
          const related = await db
            .select({
              id: m.id,
              title: m.title,
              image: m.image,
              parentMarketId: m.parentMarketId,
              conditionType: mc.type,
              data: mc.data,
              conditionId: mc.id,
              variantKey: mc.variantKey,
              yesTokenId: m.yesTokenId,
              noTokenId: m.noTokenId,
              leagueAbbreviation: mc.leagueAbbreviation,
              creatorAddress: m.creatorAddress,
              description: m.description,
            })
            .from(m)
            .innerJoin(mc, eq(mc.marketId, m.id))
            .where(
              and(
                eq(mc.asset, referenceChild.asset),
                eq(mc.type, referenceChild.conditionType),
                inArray(m.status, ["created", "resolved"]),
                or(
                  ne(m.parentMarketId, marketWithConditions.id),
                  isNull(m.parentMarketId)
                )
              )
            )

          relatedMarkets = await Promise.all(
            related.map(async (market) => {
              const orderbookData = await getMarketOrderbookData(market.id)

              const childMarkets = await db
                .select({
                  id: m.id,
                  title: m.title,
                  variantKey: mc.variantKey,
                  image: m.image,
                  conditionType: mc.type,
                  data: mc.data,
                  conditionId: mc.id,
                  yesTokenId: m.yesTokenId,
                  noTokenId: m.noTokenId,
                })
                .from(m)
                .innerJoin(mc, eq(mc.marketId, m.id))
                .where(eq(m.parentMarketId, market.id))

              const childrenWithPrices = await Promise.all(
                childMarkets.map(async (child) => {
                  const childOrderbookData = await getMarketOrderbookData(
                    child.id
                  )
                  return {
                    ...child,
                    bestPrices: childOrderbookData.bestPrices,
                    orderbook: childOrderbookData.orderbook,
                  }
                })
              )

              return {
                ...market,
                bestPrices: orderbookData.bestPrices,
                orderbook: orderbookData.orderbook,
                children: childrenWithPrices,
              }
            })
          )
        }
      } else {
        if (
          marketWithConditions.asset &&
          marketWithConditions.metric &&
          marketWithConditions.predictionDate
        ) {
          let related: any[] = []

          /* ----------  SPORTS  ---------- */
          if (marketWithConditions.conditionType === "sports") {
            /* legs of any winner-market give us their parent IDs */
            const legRows = await db
              .select({ parentId: m.parentMarketId })
              .from(m)
              .innerJoin(mc, eq(mc.marketId, m.id))
              .where(
                and(
                  eq(mc.asset, marketWithConditions.asset),
                  eq(mc.type, "sports"),
                  isNotNull(m.parentMarketId),
                  eq(m.status, "created")
                )
              )

            const parentIds: any[] = [
              ...new Set(legRows.map((r) => r.parentId)),
            ]

            const parents = parentIds.length
              ? await db
                  .select({
                    id: m.id,
                    title: m.title,
                    image: m.image,
                    parentMarketId: m.parentMarketId,
                    type: m.type,
                    description: m.description,
                    creatorAddress: m.creatorAddress,
                    volume: m.volume,
                    status: m.status,
                  })
                  .from(m)
                  .where(
                    and(
                      inArray(m.id, parentIds),
                      eq(m.type, "grouped"),
                      eq(m.status, "created")
                    )
                  )
              : []

            const singles = await db
              .select({
                id: m.id,
                title: m.title,
                image: m.image,
                parentMarketId: m.parentMarketId,
                type: m.type,
                description: m.description,
                creatorAddress: m.creatorAddress,
                volume: m.volume,
                status: m.status,
                conditionType: mc.type,
                asset: mc.asset,
                metric: mc.metric,
                metricCondition: mc.metricCondition,
                predictionDate: mc.predictionDate,
                apiId: mc.apiId,
                variantKey: mc.variantKey,
                data: mc.data,
                leagueAbbreviation: mc.leagueAbbreviation,
                conditionId: mc.id,
                yesTokenId: m.yesTokenId,
                noTokenId: m.noTokenId,
              })
              .from(m)
              .innerJoin(mc, eq(mc.marketId, m.id))
              .where(
                and(
                  eq(mc.asset, marketWithConditions.asset),
                  eq(mc.type, "sports"),
                  isNull(m.parentMarketId),
                  ne(m.id, marketWithConditions.id),
                  eq(m.status, "created")
                )
              )

            /* ③ merge parent + singles */
            related = [...parents, ...singles]
          } else {
            related = await db
              .select({
                id: m.id,
                title: m.title,
                image: m.image,
                parentMarketId: m.parentMarketId,
                conditionType: mc.type,
                data: mc.data,
                conditionId: mc.id,
                variantKey: mc.variantKey,
                yesTokenId: m.yesTokenId,
                noTokenId: m.noTokenId,
                leagueAbbreviation: mc.leagueAbbreviation,
                creatorAddress: m.creatorAddress,
                description: m.description,
              })
              .from(m)
              .innerJoin(mc, eq(mc.marketId, m.id))
              .where(
                and(
                  eq(mc.asset, marketWithConditions.asset),
                  eq(mc.type, marketWithConditions.conditionType),
                  inArray(m.status, ["created", "resolved"]),
                  ne(m.id, marketWithConditions.id)
                )
              )
          }

          relatedMarkets = await Promise.all(
            related.map(async (parent) => {
              const orderbookData = await getMarketOrderbookData(parent.id)

              const childMarkets = await db
                .select({
                  id: m.id,
                  title: m.title,
                  variantKey: mc.variantKey,
                  image: m.image,
                  conditionType: mc.type,
                  data: mc.data,
                  conditionId: mc.id,
                  asset: mc.asset,
                  metric: mc.metric,
                  metricCondition: mc.metricCondition,
                  predictionDate: mc.predictionDate,
                  apiId: mc.apiId,
                  leagueAbbreviation: mc.leagueAbbreviation,
                  yesTokenId: m.yesTokenId,
                  noTokenId: m.noTokenId,
                })
                .from(m)
                .innerJoin(mc, eq(mc.marketId, m.id))
                .where(eq(m.parentMarketId, parent.id))

              const childrenWithPrices = await Promise.all(
                childMarkets.map(async (child) => {
                  const childOrderbookData = await getMarketOrderbookData(
                    child.id
                  )
                  return {
                    ...child,
                    bestPrices: childOrderbookData.bestPrices,
                    orderbook: childOrderbookData.orderbook,
                  }
                })
              )

              let ref: any = childrenWithPrices[0]

              if (!ref) {
                const [fallbackMc] = await db
                  .select({
                    conditionType: mc.type,
                    asset: mc.asset,
                    metric: mc.metric,
                    metricCondition: mc.metricCondition,
                    predictionDate: mc.predictionDate,
                    apiId: mc.apiId,
                    variantKey: mc.variantKey,
                    data: mc.data,
                    leagueAbbreviation: mc.leagueAbbreviation,
                    conditionId: mc.id,
                    yesTokenId: m.yesTokenId,
                    noTokenId: m.noTokenId,
                  })
                  .from(m)
                  .innerJoin(mc, eq(mc.marketId, m.id))
                  .where(eq(m.parentMarketId, parent.id))
                  .limit(1)

                ref = fallbackMc ?? {}
              }

              return {
                ...parent,
                ...(ref.conditionType && { conditionType: ref.conditionType }),
                ...(ref.asset && { asset: ref.asset }),
                ...(ref.metric && { metric: ref.metric }),
                ...(ref.metricCondition && {
                  metricCondition: ref.metricCondition,
                }),
                ...(ref.predictionDate && {
                  predictionDate: ref.predictionDate,
                }),
                ...(ref.apiId && { apiId: ref.apiId }),
                ...(ref.variantKey && { variantKey: ref.variantKey }),
                ...(ref.data && { data: ref.data }),
                ...(ref.leagueAbbreviation && {
                  leagueAbbreviation: ref.leagueAbbreviation,
                }),
                ...(ref.conditionId && { conditionId: ref.conditionId }),
                ...(ref.yesTokenId && { yesTokenId: ref.yesTokenId }),
                ...(ref.noTokenId && { noTokenId: ref.noTokenId }),
                bestPrices: orderbookData.bestPrices,
                orderbook: orderbookData.orderbook,
                children: childrenWithPrices,
              }
            })
          )
        }
      }

      let parent = null
      if (market.parentMarketId) {
        const [parentMarket] = await db
          .select({
            id: m.id,
            title: m.title,
            description: m.description,
            volume: m.volume,
            image: m.image,
            endDate: m.endDate,
            parentMarketId: m.parentMarketId,
            type: m.type,
            createdAt: m.createdAt,
            status: m.status,
          })
          .from(m)
          .where(eq(m.id, market.parentMarketId))

        if (parentMarket) {
          const parentConditions = await db
            .select({
              conditionId: mc.id,
              marketId: mc.marketId,
              conditionType: mc.type,
              asset: mc.asset,
              metric: mc.metric,
              metricCondition: mc.metricCondition,
              predictionDate: mc.predictionDate,
              apiId: mc.apiId,
              variantKey: mc.variantKey,
              data: mc.data,
            })
            .from(mc)
            .where(eq(mc.marketId, parentMarket.id))

          parent = { ...parentMarket, ...parentConditions[0] }
        }
      }

      let children: any[] = []
      if (!market.parentMarketId) {
        const childMarkets = await db
          .select({
            id: m.id,
            title: m.title,
            description: m.description,
            volume: m.volume,
            image: m.image,
            endDate: m.endDate,
            parentMarketId: m.parentMarketId,
            type: m.type,
            createdAt: m.createdAt,
            status: m.status,
          })
          .from(m)
          .where(eq(m.parentMarketId, market.id))

        if (childMarkets.length > 0) {
          const childIds = childMarkets.map((c) => c.id)

          const childConditions = await db
            .select({
              conditionId: mc.id,
              marketId: mc.marketId,
              conditionType: mc.type,
              asset: mc.asset,
              metric: mc.metric,
              metricCondition: mc.metricCondition,
              predictionDate: mc.predictionDate,
              apiId: mc.apiId,
              variantKey: mc.variantKey,
              data: mc.data,
            })
            .from(mc)
            .where(inArray(mc.marketId, childIds))

          const conditionsByMarketId = childConditions.reduce((acc, cond) => {
            acc[cond.marketId] = cond
            return acc
          }, {} as Record<string, any>)

          children = childMarkets.map((child) => ({
            ...child,
            ...conditionsByMarketId[child.id],
          }))
        }
      }

      const singleResult = await attachCreator({
        ...marketWithConditions,
        ...(parent && { parent }),
        ...(children.length > 0 && { children }),
        grouped: parent?.type === "grouped",
        relatedMarkets: await Promise.all(relatedMarkets.map(attachCreator)),
      })

      return [singleResult]
    }

    // -------------------------
    // MULTI MARKET FETCH (LIST)
    // -------------------------

    let parentIds: string[] = []
    let singleMarkets: string[] = []

    if (league) {
      const rows = await db
        .select({
          id: m.id,
          parentId: m.parentMarketId,
          type: m.type,
        })
        .from(m)
        .innerJoin(mc, eq(mc.marketId, m.id))
        .where(
          and(
            inArray(m.status, ["created", "resolved"]),
            eq(mc.leagueAbbreviation, league)
          )
        )

      singleMarkets = rows
        .filter((r) => r.type !== "grouped" && !r.parentId)
        .map((r) => r.id)

      const candidateParentIds: any[] = [
        ...new Set(rows.map((r) => r.parentId).filter(Boolean)),
      ]

      const groupedParents = await db
        .select({ id: m.id })
        .from(m)
        .where(
          and(
            inArray(m.id, candidateParentIds),
            eq(m.type, "grouped"),
            inArray(m.status, ["created", "resolved"])
          )
        )

      parentIds = groupedParents.map((gp) => gp.id)
    } else {
      const roots = await db
        .select({ id: m.id })
        .from(m)
        .where(
          and(
            inArray(m.status, ["created", "resolved"]),
            isNull(m.parentMarketId)
          )
        )

      parentIds = roots.map((r) => r.id)
    }

    if (parentIds.length === 0 && singleMarkets.length === 0) return []

    const marketsResult = await db
      .select({
        id: m.id,
        title: m.title,
        description: m.description,
        volume: m.volume,
        image: m.image,
        endDate: m.endDate,
        parentMarketId: m.parentMarketId,
        type: m.type,
        createdAt: m.createdAt,
        status: m.status,
        conditionId: m.conditionId,
        yesTokenId: m.yesTokenId,
        noTokenId: m.noTokenId,
        creatorAddress: m.creatorAddress,
      })
      .from(m)
      .where(
        and(
          ne(m.status, "pending"),
          inArray(m.id, [...parentIds, ...singleMarkets])
        )
      )

    const childrenResult = await db
      .select({
        id: m.id,
        title: m.title,
        description: m.description,
        volume: m.volume,
        image: m.image,
        endDate: m.endDate,
        parentMarketId: m.parentMarketId,
        type: m.type,
        createdAt: m.createdAt,
        status: m.status,
        conditionId: m.conditionId,
        yesTokenId: m.yesTokenId,
        noTokenId: m.noTokenId,
        creatorAddress: m.creatorAddress,
      })
      .from(m)
      .where(and(ne(m.status, "pending"), inArray(m.parentMarketId, parentIds)))
      .orderBy(m.createdAt)

    const allMarketIds = [
      ...parentIds,
      ...singleMarkets,
      ...childrenResult.map((c) => c.id),
    ]

    const conditionsResult = await db
      .select({
        conditionId: mc.id,
        marketId: mc.marketId,
        conditionType: mc.type,
        asset: mc.asset,
        metric: mc.metric,
        metricCondition: mc.metricCondition,
        predictionDate: mc.predictionDate,
        apiId: mc.apiId,
        variantKey: mc.variantKey,
        leagueAbbreviation: mc.leagueAbbreviation,
        data: mc.data,
      })
      .from(mc)
      .where(inArray(mc.marketId, allMarketIds))

    const conditionsByMarketId = conditionsResult.reduce((acc, cond) => {
      if (!acc[cond.marketId]) acc[cond.marketId] = []
      acc[cond.marketId].push(cond)
      return acc
    }, {} as Record<string, any[]>)

    const marketsWithChildren: any = marketsResult.map((parent) => {
      const children = childrenResult
        .filter((c) => c.parentMarketId === parent.id)
        .map((c) => ({
          ...c,
          ...conditionsByMarketId[c.id]?.[0],
        }))

      const parentCondition = conditionsByMarketId[parent.id]?.[0]
      const fallbackChildCondition = children.find((c) => c.conditionType)

      return {
        ...parent,
        leagueAbbreviation:
          parentCondition?.leagueAbbreviation ||
          fallbackChildCondition?.leagueAbbreviation,
        conditionType:
          parentCondition?.conditionType ||
          fallbackChildCondition?.conditionType,
        apiId: parentCondition?.apiId || fallbackChildCondition?.apiId,
        predictionDate:
          parentCondition?.predictionDate ||
          fallbackChildCondition?.predictionDate,
        variantKey:
          parentCondition?.variantKey || fallbackChildCondition?.variantKey,
        data: parentCondition?.data || fallbackChildCondition?.data,
        children: children.length > 0 ? children : undefined,
        asset: parentCondition?.asset || fallbackChildCondition?.asset,
        metric: parentCondition?.metric || fallbackChildCondition?.metric,
        grouped: parent.type === "grouped",
      }
    })
    for (const mkt of marketsWithChildren) {
      // Get orderbook data for parent market
      if (!mkt.parentMarketId && mkt.type !== "grouped") {
        const orderbookData = await getMarketOrderbookData(mkt.id)
        const { bestPrices, orderbook } = orderbookData
        mkt.bestPrices = bestPrices
        mkt.orderbook = orderbook

        const ask = bestPrices?.yesBestAsk ?? 0.5
        mkt.odds = {
          team1: `${ask * 100} ¢`,
          team2: `${(1 - ask) * 100} ¢`,
        }
      }
      // Process children markets if they exist
      if (mkt.children && mkt.children.length > 0) {
        mkt.children = await Promise.all(
          mkt.children.map(async (child: any) => {
            const childData = await getMarketOrderbookData(child.id)
            return {
              ...child,
              orderbook: childData.orderbook,
              bestPrices: childData.bestPrices,
            }
          })
        )
      }
    }

    return await Promise.all(
      marketsWithChildren.map(async (mkt: any) => {
        const enriched = await attachCreator(mkt)

        if (enriched.children) {
          enriched.children = await Promise.all(
            enriched.children.map(attachCreator)
          )
        }

        return enriched
      })
    )
  } catch (err) {
    console.error("Error fetching markets:", err)
    throw err
  }
}
