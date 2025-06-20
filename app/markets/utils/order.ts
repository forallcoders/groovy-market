/* eslint-disable @typescript-eslint/no-explicit-any */
import { addDays, format } from 'date-fns';

// Calculate total cost for limit orders
export function calculateTotalCost(shares: number, limitPrice: number): number {
  return (shares * limitPrice) / 100;
}

// Calculate expiration timestamp
export function calculateExpirationTimestamp(
  expiration: number,
  customExpiration: Date | string | null
): number {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds

  // If using predefined expiration period
  if (expiration > 0) {
    return now + expiration;
  }

  // If using custom date
  if (customExpiration) {
    const customDate = new Date(customExpiration);
    // Set time to end of day
    customDate.setHours(23, 59, 59, 999);
    return Math.floor(customDate.getTime() / 1000);
  }

  // Default to 24 hours if something goes wrong
  return now + 24 * 60 * 60;
}

// Get default expiration date (1 day from now)
export function getDefaultExpirationDate(): string {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}

// Format order data for API requests
export function formatOrderForApi(order: any): any {
  return {
    ...order,
    salt: order.salt.toString(),
    makerAmount: order.makerAmount.toString(),
    takerAmount: order.takerAmount.toString(),
    expiration: order.expiration.toString(),
    nonce: order.nonce.toString(),
    feeRateBps: order.feeRateBps.toString(),
    tokenId: order.tokenId?.toString(),
  };
}

export function generateOrderSalt(): bigint {
  // Combine current timestamp with a random component
  const timestamp = BigInt(Date.now());
  const randomComponent = BigInt(Math.floor(Math.random() * 1000000));
  const result = (timestamp << BigInt(20)) | randomComponent;
  return result;
}

// Filter and sort orders based on trade type and token selection
export function filterOrders(
  orders: any[],
  tradeType: 'BUY' | 'SELL',
  selectedOption: 'YES' | 'NO',
  yesTokenId: string,
  noTokenId: string
): any[] {
  return orders
    .filter((order) => order.side === (tradeType === 'BUY' ? 'SELL' : 'BUY'))
    .filter(
      (order) =>
        order.tokenId === (selectedOption === 'YES' ? yesTokenId : noTokenId)
    )
    .sort(
      (a, b) =>
        Number(a.takerAmount) / Number(a.makerAmount) -
        Number(b.takerAmount) / Number(b.makerAmount)
    );
}

// Calculate maximum buy amount
export function calculateMaxBuy(
  orderBookData: any,
  selectedOption: 'YES' | 'NO'
): number {
  if (!orderBookData) {
    return 0;
  }

  // Get the relevant asks based on selected token
  const relevantAsks =
    selectedOption === 'YES'
      ? orderBookData.yesAsks || []
      : orderBookData.noAsks || [];

  if (relevantAsks.length === 0) {
    return 0;
  }

  // Calculate total cost from all asks
  return relevantAsks.reduce((acc: any, ask: any) => {
    // Price is in cents in the splitOrderBookTables output
    const price = ask.price / 100; // Convert from cents to dollars
    const size = ask.shares;
    const cost = price * size;
    return acc + cost;
  }, 0);
}

// Calculate maximum sell amount
export function calculateMaxMarketSell(
  orderBookData: any,
  selectedOption: 'YES' | 'NO'
): number {
  if (!orderBookData) {
    return 0;
  }
  const relevantAsks =
    selectedOption === 'YES'
      ? orderBookData.yesBids || []
      : orderBookData.noBids || [];

  if (relevantAsks.length === 0) {
    return 0;
  }

  // Calculate total cost from all asks
  return relevantAsks.reduce((acc: any, ask: any) => {
    // Price is in cents in the splitOrderBookTables output
    const size = ask.shares;
    return acc + size;
  }, 0);
}

export function calculateMaxLimitSell(
  selectedOption: 'YES' | 'NO',
  yesTokenBalance: bigint,
  noTokenBalance: bigint
): number {
  return selectedOption === 'YES'
    ? Number(yesTokenBalance) / 10 ** 6
    : Number(noTokenBalance) / 10 ** 6;
}

export function validateBuyLimitOrder(
  balance: number,
  sharesAmount: string,
  limitPrice: string
): { isValid: boolean; error: string | null } {
  if (!sharesAmount || !limitPrice) {
    return {
      isValid: false,
      error: 'Please enter both shares amount and limit price',
    };
  }

  const shares = Number(sharesAmount);
  const price = Number(limitPrice) / 100; // Convert cents to dollars

  if (isNaN(shares) || shares <= 0) {
    return { isValid: false, error: 'Please enter a valid shares amount' };
  }

  if (isNaN(price) || price < 0.01 || price > 0.99) {
    return { isValid: false, error: 'Limit price must be between 1¢ and 99¢' };
  }

  const totalCost = shares * price;

  if (totalCost > balance) {
    return {
      isValid: false,
      error: `Insufficient balance. Order requires $${totalCost.toFixed(2)}, but you have $${balance.toFixed(2)}`,
    };
  }

  return { isValid: true, error: null };
}

export function validateSellLimitOrder(
  maxSell: number,
  sharesAmount: string,
  limitPrice: string
): { isValid: boolean; error: string | null } {
  if (!sharesAmount || !limitPrice) {
    return {
      isValid: false,
      error: 'Please enter both shares amount and limit price',
    };
  }

  const shares = Number(sharesAmount);
  const price = Number(limitPrice) / 100; // Convert cents to dollars

  if (isNaN(shares) || shares <= 0) {
    return { isValid: false, error: 'Please enter a valid shares amount' };
  }

  if (isNaN(price) || price < 0.01 || price > 0.99) {
    return { isValid: false, error: 'Limit price must be between 1¢ and 99¢' };
  }

  if (shares > maxSell) {
    return {
      isValid: false,
      error: `Insufficient token balance. You can sell a maximum of ${maxSell.toFixed(2)} shares`,
    };
  }

  return { isValid: true, error: null };
}

export const getBestPrice = (
  orderbook: any,
  token: 'YES' | 'NO',
  tradeType: 'BUY' | 'SELL'
): number => {
  if (!orderbook) return 0;

  if (token === 'YES') {
    return tradeType === 'BUY'
      ? (orderbook.yesAsks[0]?.price ?? 0)
      : (orderbook.yesBids[0]?.price ?? 0);
  } else {
    return tradeType === 'BUY'
      ? (orderbook.noAsks[0]?.price ?? 0)
      : (orderbook.noBids[0]?.price ?? 0);
  }
};

export const getVisibleOrders = (
  book: any,
  token: 'YES' | 'NO',
  tradeType: 'BUY' | 'SELL'
) => {
  if (token === 'YES') {
    return tradeType === 'BUY' ? book.yesAsks : book.yesBids;
  } else {
    return tradeType === 'BUY' ? book.noAsks : book.noBids;
  }
};
