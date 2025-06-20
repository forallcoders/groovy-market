import DetailsPage from "@/app/markets/components/details/details-page"
import GroupDetailsPage from "@/app/markets/components/details/group-details-page"

interface Props {
  params: Promise<{
    league: string
    market: string
  }>
}

export default async function MarketDetailsPage({ params }: Props) {
  const { league, market } = await params
  const isCrypto = league === "crypto"

  // Fetch the market data
  const marketResponse = await fetch(
    `${process.env.NEXT_PUBLIC_URL_BASE}/api/markets/${market}${
      !isCrypto ? `?league=${league}` : "?type=crypto"
    }`
  )
  if (!marketResponse.ok) {
    throw new Error(`Failed to fetch market data: ${marketResponse.statusText}`)
  }

  const marketRes = await marketResponse.json()

  const marketData = marketRes[0]
  if (marketData.grouped) {
    if (isCrypto) return <GroupDetailsPage market={marketData} />
    else return <DetailsPage market={marketData} />
  } else {
    const marketWithParentId = marketData.parentMarketId
      ? { ...marketData, id: marketData.id }
      : marketData
    return <DetailsPage market={marketWithParentId} />
  }
}
