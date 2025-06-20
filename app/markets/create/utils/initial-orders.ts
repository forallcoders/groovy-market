export function generateInitialOrders({
  probability,
  initialLiquidity,
  yesTokenId,
  noTokenId,
  marketId,
  userAddress,
  side = "BUY",
}: {
  probability: number
  initialLiquidity: number
  yesTokenId: string
  noTokenId: string
  marketId: string
  userAddress: string
  side?: "BUY" | "SELL"
}) {
  const margin = 0.02
  const yesPrice = parseFloat((probability / 100).toFixed(2))
  const noPrice = parseFloat((1 - yesPrice).toFixed(2))

  let adjustedYesPrice: number
  let adjustedNoPrice: number

  if (side === "BUY") {
    const adjustment = margin / 2
    adjustedYesPrice = +(yesPrice - adjustment).toFixed(2)
    adjustedNoPrice = +(noPrice - adjustment).toFixed(2)
    if (adjustedYesPrice + adjustedNoPrice >= 1) {
      adjustedYesPrice -= 0.01
    }
  } else {
    const adjustment = margin / 2
    adjustedYesPrice = +(yesPrice + adjustment).toFixed(2)
    adjustedNoPrice = +(noPrice + adjustment).toFixed(2)
    if (adjustedYesPrice + adjustedNoPrice <= 1) {
      adjustedYesPrice += 0.01
    }
  }

  return [
    {
      side,
      tokenId: yesTokenId,
      price: adjustedYesPrice.toFixed(2),
      amount: initialLiquidity.toString(),
      marketId,
      userAddress,
    },
    {
      side,
      tokenId: noTokenId,
      price: adjustedNoPrice.toFixed(2),
      amount: initialLiquidity.toString(),
      marketId,
      userAddress,
    },
  ]
}
