import axios from "axios"

export async function syncUserPosition(params: {
  userAddress: string
  marketId: string
  tokenId: string
  conditionId: string
  entryPrice?: string
}): Promise<void> {
  try {
    const body: Record<string, unknown> = { ...params }
    if (params.entryPrice === undefined) delete body.entryPrice
    await axios.post("/api/positions/sync-user-positions", body)
  } catch (err) {
    console.error("Failed to sync user position:", err)
  }
}

/**
 * Sync the traded side of the market.
 * - If tradeType / side / bestPrices are omitted, we assume it's an UPDATE‑only
 *   and do **not** include entryPrice.
 * - If they’re present, we calculate and pass entryPrice (INSERT / add‑to‑position).
 */
export async function syncUserMarketPositions({
  userAddress,
  marketId,
  conditionId,
  yesTokenId,
  noTokenId,
  tradeType,
  side,
  bestPrices,
  amount,
}: {
  userAddress: string
  marketId: string
  yesTokenId: string
  noTokenId: string
  conditionId: string
  tradeType?: "BUY" | "SELL"
  side: "YES" | "NO" | "BOTH"
  bestPrices?: {
    yesBestBid: number
    yesBestAsk: number
    noBestBid: number
    noBestAsk: number
  }
  amount?: {
    yes?: number
    no?: number
  }
}): Promise<void> {
  if (!userAddress || !marketId || !conditionId) {
    console.warn("Missing required parameters for syncing user positions")
    return
  }

  const tokenIds =
    side === "BOTH"
      ? [yesTokenId, noTokenId]
      : side === "YES"
      ? [yesTokenId]
      : side === "NO"
      ? [noTokenId]
      : []
  if (tokenIds.some((tokenId) => !tokenId)) {
    console.warn("TokenId missing or side undefined; skipping sync")
    return
  }

  await Promise.all(
    tokenIds.map(async (tokenId) => {
      const tokenSide = tokenId === yesTokenId ? "YES" : "NO"
      let entryPrice
      if (bestPrices) {
        const priceMap: any = {
          YES: { BUY: bestPrices.yesBestAsk, SELL: bestPrices.yesBestBid },
          NO: { BUY: bestPrices.noBestAsk, SELL: bestPrices.noBestBid },
        } as const

        entryPrice =
          tradeType && bestPrices
            ? priceMap[tokenSide as "YES" | "NO"][tradeType]?.toString()
            : undefined
      }

      await syncUserPosition({
        userAddress,
        marketId,
        tokenId,
        conditionId,
        entryPrice,
        ...(amount
          ? {
              amount:
                tokenSide === "YES"
                  ? amount.yes?.toString()
                  : amount.no?.toString(),
            }
          : {}),
      })
    })
  )
}
