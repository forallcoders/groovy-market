import { makeRational } from "./rational"

export type OrderCalculation = {
  filledAmount: bigint
  makerAmount: bigint
  takerAmount: bigint
  side: number
}

/**
 * Helper to calculate taker amount proportionally with round-up precision
 */
export function calculateTakingAmount(
  makingAmount: bigint,
  makerAmount: bigint,
  takerAmount: bigint
): bigint {
  if (makerAmount === BigInt(0)) return BigInt(0)
  return (makingAmount * takerAmount + makerAmount - BigInt(1)) / makerAmount
}

export function computeLeftoverAmounts(order: OrderCalculation): {
  leftoverMaker: bigint
  leftoverTaker: bigint
} {
  const filled = order.filledAmount || BigInt(0)
  const leftoverMaker = order.makerAmount - filled
  if (leftoverMaker <= BigInt(0)) {
    return { leftoverMaker: BigInt(0), leftoverTaker: BigInt(0) }
  }

  const leftoverTaker =
    order.side === 1
      ? calculateTakingAmount(
          leftoverMaker,
          order.makerAmount,
          order.takerAmount
        )
      : calculateTakingAmount(
          leftoverMaker,
          order.makerAmount,
          order.takerAmount
        )

  return { leftoverMaker, leftoverTaker }
}
const ONE = BigInt(10) ** BigInt(18)

export function calculatePrice(order: OrderCalculation): bigint {
  if (order.side === 0) {
    // BUY: price = makerAmount / takerAmount
    return order.takerAmount === BigInt(0)
      ? BigInt(0)
      : (order.makerAmount * ONE) / order.takerAmount
  } else {
    // SELL: price = takerAmount / makerAmount
    return order.makerAmount === BigInt(0)
      ? BigInt(0)
      : (order.takerAmount * ONE) / order.makerAmount
  }
}

export function isCrossing(a: OrderCalculation, b: OrderCalculation): boolean {
  if (a.takerAmount === BigInt(0) || b.takerAmount === BigInt(0)) return true
  console.log({ orderA: a })
  console.log({ orderB: b })
  const priceA = calculatePrice(a)
  const priceB = calculatePrice(b)
  console.log({ priceA })
  console.log({ priceB })
  if (a.side === 0) {
    if (b.side === 0) return priceA + priceB >= ONE
    return priceA >= priceB
  }
  if (b.side === 0) return priceB >= priceA
  return priceA + priceB <= ONE
}

export function calculateFillAmount(
  taker: OrderCalculation,
  maker: OrderCalculation
): bigint {
  const takerLeft = computeLeftoverAmounts(taker)
  const makerLeft = computeLeftoverAmounts(maker)

  console.log("DETAILED FILL CALCULATION:")
  console.log("  Taker order side:", taker.side)
  console.log("  Maker order side:", maker.side)
  console.log("  Taker makerAmount:", taker.makerAmount.toString())
  console.log("  Taker takerAmount:", taker.takerAmount.toString())
  console.log("  Maker makerAmount:", maker.makerAmount.toString())
  console.log("  Maker takerAmount:", maker.takerAmount.toString())

  if (
    takerLeft.leftoverMaker <= BigInt(0) ||
    takerLeft.leftoverTaker <= BigInt(0) ||
    makerLeft.leftoverMaker <= BigInt(0) ||
    makerLeft.leftoverTaker <= BigInt(0)
  ) {
    console.log("  Zero leftover detected - returning 0")
    return BigInt(0)
  }

  if (taker.side === 1 && maker.side === 1) {
    // For merging, take the minimum of the two token amounts
    return takerLeft.leftoverMaker < makerLeft.leftoverMaker
      ? takerLeft.leftoverMaker
      : makerLeft.leftoverMaker
  }

  // For BUY/SELL match
  if (taker.side === 0 && maker.side === 1) {
    // Calculate price ratios
    const takerPrice = Number(taker.makerAmount) / Number(taker.takerAmount)
    const makerPrice = Number(maker.takerAmount) / Number(maker.makerAmount)

    console.log("  Taker price (USDC per token):", takerPrice)
    console.log("  Maker price (USDC per token):", makerPrice)

    // Calculate how much USDC taker wants to spend
    const usdcAvailable = takerLeft.leftoverMaker

    // Calculate how many tokens the maker has available
    const tokensAvailable = makerLeft.leftoverMaker

    // Calculate how much USDC the maker wants for their tokens
    const usdcWanted = makerPrice * Number(tokensAvailable)

    // Take the minimum
    const fillAmount =
      usdcAvailable < BigInt(Math.floor(usdcWanted))
        ? usdcAvailable
        : BigInt(Math.floor(usdcWanted))

    console.log("  USDC available from taker:", usdcAvailable.toString())
    console.log("  Tokens available from maker:", tokensAvailable.toString())
    console.log("  USDC wanted by maker:", Math.floor(usdcWanted))
    console.log("  Final fill amount (USDC):", fillAmount.toString())

    return fillAmount
  }

  // Original logic for other cases
  if (taker.side === 0) {
    const fillAmount =
      makerLeft.leftoverMaker < takerLeft.leftoverTaker
        ? makerLeft.leftoverMaker
        : takerLeft.leftoverTaker
    console.log("  Using standard logic - fill amount:", fillAmount.toString())
    return fillAmount
  } else {
    const fillAmount =
      makerLeft.leftoverTaker < takerLeft.leftoverMaker
        ? makerLeft.leftoverTaker
        : takerLeft.leftoverMaker
    console.log("  Using standard logic - fill amount:", fillAmount.toString())
    return fillAmount
  }
}

export function calculateOrderPrice(order: OrderCalculation): number {
  const { leftoverMaker, leftoverTaker } = computeLeftoverAmounts(order)
  if (leftoverMaker <= BigInt(0) || leftoverTaker <= BigInt(0)) return 0

  const priceRational =
    order.side === 0
      ? makeRational(leftoverMaker, leftoverTaker)
      : makeRational(leftoverTaker, leftoverMaker)

  return Number(priceRational.numerator) / Number(priceRational.denominator)
}

export function computeFloatPrice(order: OrderCalculation): number {
  const { leftoverMaker, leftoverTaker } = computeLeftoverAmounts(order)
  if (leftoverMaker <= BigInt(0) || leftoverTaker <= BigInt(0)) return 0

  return order.side === 0
    ? Number(leftoverMaker) / Number(leftoverTaker)
    : Number(leftoverTaker) / Number(leftoverMaker)
}
