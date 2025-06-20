import { db } from "@/lib/db/client";
import { marketConditionsTable, marketsTable } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
const tokens = [
  {
    name: "BTC",
    id: "bitcoin",
  },
  {
    name: "ETH",
    id: "ethereum",
  },
  {
    name: "SEI",
    id: "sei-network",
  },
];

export async function GET(req: NextRequest) {
  const pendingMarkets = await db
    .select()
    .from(marketsTable)
    .where(
      and(
        eq(marketsTable.status, "created"),
        eq(marketConditionsTable.type, "crypto")
      )
    )
    .fullJoin(
      marketConditionsTable,
      eq(marketsTable.id, marketConditionsTable.marketId)
    )
    .orderBy(asc(marketConditionsTable.predictionDate));
  console.log({ pendingMarkets });

  const marketsByAssetAndDate = pendingMarkets.reduce((acc, market) => {
    if (!market.markets || !market.market_conditions) return acc;

    const asset = market.market_conditions.asset;
    const date = market.market_conditions.predictionDate;
    const coinGeckoId = getCoinGeckoId(asset);
    const key = `${coinGeckoId}-${date}`;

    if (!acc[key]) {
      acc[key] = {
        asset,
        date,
        markets: [],
        coinGeckoId,
      };
    }

    acc[key].markets.push(market);
    return acc;
  }, {} as Record<string, { asset: string; date: string | null; markets: typeof pendingMarkets; coinGeckoId: string }>);

  const rawResults = Object.keys(marketsByAssetAndDate).map(async (key) => {
    const { asset, date, markets, coinGeckoId } = marketsByAssetAndDate[key];

    // Create a proper Date object from the predictionDate string
    const predictionDate = new Date(date!);
    const currentDate = new Date();

    console.log(
      `Processing ${markets.length} markets for ${asset} on ${
        predictionDate.toISOString().split("T")[0]
      }`
    );

    if (predictionDate > currentDate) {
      return `Skipping ${asset} markets for ${
        predictionDate.toISOString().split("T")[0]
      } as the date hasn't passed yet`;
    }

    const price = await fetchExactDatePrice(coinGeckoId, predictionDate);

    if (!price) {
      return `Could not get price for ${asset} on ${
        predictionDate.toISOString().split("T")[0]
      }`;
    }

    const mappedMarkets = await Promise.all(
      markets.map(async (market) => {
        const condition = market.market_conditions;
        const resolution = resolveMarket(condition, price);
        await db
          .update(marketsTable)
          .set({
            status: "closed",
          })
          .where(eq(marketsTable.id, market.markets!.id!));

        await db
          .update(marketConditionsTable)
          .set({
            data: {
              ...market.market_conditions!.data!,
              resolution: resolution ? true : false,
            },
          })
          .where(eq(marketConditionsTable.id, market.market_conditions!.id!));
        return {
          marketId: market.markets?.id,
          title: market.markets?.title,
          resolution: resolution ? "YES" : "NO",
        };
      })
    );
    console.log({ mappedMarkets });
    return {
      asset,
      date,
      markets: mappedMarkets,
      coinGeckoId,
    };
  });

  const results = await Promise.all(rawResults);

  return NextResponse.json({
    results,
  });
}

function getCoinGeckoId(asset: string) {
  // Use the tokens array for mapping
  const tokens = [
    {
      name: "BTC",
      id: "bitcoin",
    },
    {
      name: "ETH",
      id: "ethereum",
    },
    {
      name: "SEI",
      id: "sei-network",
    },
  ];

  // Find the matching token and return its ID
  const token = tokens.find(
    (t) => t.name.toLowerCase() === asset.toLowerCase()
  );

  // Return the mapped ID or fallback to lowercase asset as the ID
  return token ? token.id : asset.toLowerCase();
}

function resolveMarket(condition: any, actualPrice: number) {
  console.log({ condition, actualPrice });
  if (!condition || !condition.data) return null;

  switch (condition.metricCondition) {
    case "greater-than":
      return actualPrice >= parseFloat(condition.data.price);

    case "less-than":
      return actualPrice <= parseFloat(condition.data.price);

    case "in-between":
      const minPrice = parseFloat(condition.data.price);
      const maxPrice = parseFloat(condition.data.priceMax);
      return actualPrice >= minPrice && actualPrice <= maxPrice;

    case "equal-to":
      // For crypto, exact equality is very unlikely
      // Consider a small tolerance (e.g., 0.1%)
      const targetPrice = parseFloat(condition.data.price);
      const tolerance = targetPrice * 0.001;
      return Math.abs(actualPrice - targetPrice) <= tolerance;

    default:
      console.log(`Unknown condition: ${condition.metricCondition}`);
      return null;
  }
}

async function fetchExactDatePrice(coinId: string, date: Date) {
  try {
    // Format date for CoinGecko API (DD-MM-YYYY)
    const formattedDate = `${date.getDate().toString().padStart(2, "0")}-${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${date.getFullYear()}`;

    // CoinGecko API endpoint for a specific date
    const url = `https://pro-api.coingecko.com/api/v3/coins/${coinId}/history?date=${formattedDate}&localization=false`;

    console.log(`Fetching exact price for ${coinId} on ${formattedDate}`);

    // Add API key if available in environment
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (process.env.COINGECKO_API_KEY) {
      headers["x-cg-pro-api-key"] = process.env.COINGECKO_API_KEY;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.warn(
        `CoinGecko history API error: ${response.status} for date ${formattedDate}. Will try range method.`
      );
      return null;
    }

    const data = await response.json();

    // Check if we have a proper response with market data
    if (!data || !data.market_data || !data.market_data.current_price) {
      console.warn(`No market data found for ${coinId} on ${formattedDate}`);
      return null;
    }

    // Get the price from the market data - extract USD price
    const price = data.market_data.current_price.usd;

    if (price === undefined || price === null) {
      console.warn(`USD price not available for ${coinId} on ${formattedDate}`);
      return null;
    }

    console.log(
      `Successfully retrieved price for ${coinId} on ${formattedDate}: ${price}`
    );
    return price;
  } catch (error) {
    console.error(`Error fetching exact date price for ${coinId}:`, error);
    return null;
  }
}
