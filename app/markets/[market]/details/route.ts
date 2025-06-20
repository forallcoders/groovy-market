// import DetailsPage from "@/app/markets/components/details/details-page"
// import GroupDetailsPage from "@/app/markets/components/details/group-details-page"
import { getMarkets } from "@/lib/market/get-markets";
import { NextRequest, NextResponse } from "next/server";

interface Props {
  params: Promise<{
    league: string;
    market: string;
  }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { market } = await params;
  const allMarkets = await getMarkets(market);
  const marketData = allMarkets[0];
  console.dir(marketData, { depth: Infinity });
  const isCrypto = marketData.children.at(0)?.conditionType === "crypto";
  console.log("isCrypto", isCrypto);
  if (isCrypto) {
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_URL_BASE +
        `/markets/crypto/${market}/details`
    );
  } else {
    const league = marketData.children.at(0)?.data?.league_abbreviation;
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_URL_BASE +
        `/markets/sports/${league}/${market}/details`
    );
  }
}
