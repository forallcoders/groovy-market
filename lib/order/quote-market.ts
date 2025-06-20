type Ask = {
  price: number; // USDC per share
  quantity: number; // # of shares (e.g. 5.25)
};

type QuoteOrderParams = {
  usdcAmount: number; // $10
  asks: Ask[]; // sorted lowest price first
  outcomeTokenDecimals?: number; // default 6
  usdcDecimals?: number; // default 6
};

type QuoteOrderSellParams = {
  shares: number; // e.g. 16.666666
  bids: Ask[]; // sorted highest price first
  outcomeTokenDecimals?: number; // default 6
  usdcDecimals?: number; // default 6
};

type QuoteOrderResult = {
  shares: number; // e.g. 16.666666
  cost: number; // actual USDC spent
  makerAmount: bigint; // in outcome token units (on-chain)
  takerAmount: bigint; // in USDC units (on-chain)
  usedAsks: Ask[];
  averagePrice: number;
};

/**
 * Calculates the parameters for a market buy order
 * @param params Order parameters including USDC amount to spend and available asks
 * @returns Quote result with calculated shares, costs, and on-chain values
 */
export function quoteMarketBuy({
  usdcAmount,
  asks,
  outcomeTokenDecimals = 6,
  usdcDecimals = 6,
}: QuoteOrderParams): QuoteOrderResult {
  let remainingUSDC = usdcAmount;
  let totalShares = 0;
  const usedAsks: Ask[] = [];

  // Initialize with highest ask price to ensure crossing
  let highestAskPrice = asks.length > 0 ? asks[asks.length - 1].price : 0;

  // Process each ask to calculate total shares we can get
  for (const ask of asks) {
    // Calculate available shares after normalization
    const availableShares = ask.quantity / 10 ** outcomeTokenDecimals;
    // Cost to buy all available shares at this price
    const costForAllShares = ask.price * availableShares;

    if (remainingUSDC >= costForAllShares) {
      // Can buy all shares at this price level
      totalShares += availableShares;
      remainingUSDC -= costForAllShares;
      usedAsks.push({
        price: ask.price,
        quantity: availableShares * 10 ** outcomeTokenDecimals,
      });
    } else {
      // Can only buy a portion of shares at this price level
      const partialShares = remainingUSDC / ask.price;
      totalShares += partialShares;
      usedAsks.push({
        price: ask.price,
        quantity: partialShares * 10 ** outcomeTokenDecimals,
      });
      remainingUSDC = 0;
      break;
    }

    // Keep track of highest ask price encountered
    if (ask.price > highestAskPrice) {
      highestAskPrice = ask.price;
    }
  }

  const totalCost = usdcAmount - remainingUSDC;

  // For market orders, we need to ensure the price will cross with all asks
  // So we use the highest ask price, slightly increased to ensure crossing
  const crossingPrice = highestAskPrice; // Add 0.1% to ensure crossing

  // Calculate shares based on total cost and crossing price
  // This ensures our order will execute against all available asks
  const sharesToReceive = totalCost / crossingPrice;

  // The actual on-chain parameters
  // For a BUY order: makerAmount is collateral (USDC), takerAmount is outcome tokens
  const takerAmount = BigInt(
    Math.floor(sharesToReceive * 10 ** outcomeTokenDecimals)
  );
  const makerAmount = BigInt(Math.floor(totalCost * 10 ** usdcDecimals));

  const averagePrice = totalShares > 0 ? totalCost / totalShares : 0;

  return {
    shares: totalShares,
    cost: totalCost,
    makerAmount, // USDC to spend
    takerAmount, // Tokens to receive
    usedAsks,
    averagePrice,
  };
}

/**
 * Calculates the parameters for a market sell order
 * @param params Order parameters including shares to sell and available bids
 * @returns Quote result with calculated cost, proceeds, and on-chain values
 */
export function quoteMarketSell({
  shares,
  bids,
  outcomeTokenDecimals = 6,
  usdcDecimals = 6,
}: QuoteOrderSellParams): QuoteOrderResult {
  let remainingShares = shares;
  let totalProceeds = 0;
  const usedBids: Ask[] = [];

  // Initialize with lowest bid price to ensure crossing
  let lowestBidPrice = bids.length > 0 ? bids[bids.length - 1].price : 1;

  // Process each bid to calculate total proceeds
  for (const bid of bids) {
    // Calculate available quantity after normalization
    const bidQuantity = bid.quantity / 10 ** outcomeTokenDecimals;

    if (remainingShares >= bidQuantity) {
      // Can sell to the entire bid
      totalProceeds += bidQuantity * bid.price;
      remainingShares -= bidQuantity;
      usedBids.push({
        price: bid.price,
        quantity: bidQuantity * 10 ** outcomeTokenDecimals,
      });
    } else {
      // Can only sell a portion to this bid
      totalProceeds += remainingShares * bid.price;
      usedBids.push({
        price: bid.price,
        quantity: remainingShares * 10 ** outcomeTokenDecimals,
      });
      remainingShares = 0;
      break;
    }

    // Keep track of lowest bid price encountered
    if (bid.price < lowestBidPrice) {
      lowestBidPrice = bid.price;
    }
  }

  // For market orders, we need to ensure the price will cross with all bids
  // So we use the lowest bid price, slightly decreased to ensure crossing
  const crossingPrice = lowestBidPrice; // Subtract 0.1% to ensure crossing

  // Calculate proceeds based on shares and crossing price
  const proceedsToReceive = (shares - remainingShares) * crossingPrice;

  // The actual on-chain parameters
  // For a SELL order: makerAmount is outcome tokens, takerAmount is collateral (USDC)
  const makerAmount = BigInt(Math.floor(shares * 10 ** outcomeTokenDecimals));
  const takerAmount = BigInt(
    Math.floor(proceedsToReceive * 10 ** usdcDecimals)
  );

  const averagePrice =
    shares > 0 ? totalProceeds / (shares - remainingShares) : 0;

  return {
    shares: shares - remainingShares, // Shares successfully sold
    cost: totalProceeds, // Actually this is the proceeds from selling
    makerAmount, // Tokens to sell
    takerAmount, // USDC to receive
    usedAsks: usedBids, // Note: these are actually bids, not asks
    averagePrice,
  };
}
