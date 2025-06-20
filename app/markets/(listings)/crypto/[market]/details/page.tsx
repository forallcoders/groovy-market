import DetailsPage from "@/app/markets/components/details/details-page"
import GroupDetailsPage from "@/app/markets/components/details/group-details-page"

interface Props {
  params: Promise<{
    league: string
    market: string
  }>
}

export default async function MarketDetailsPage({ params }: Props) {
  const { market } = await params

  // Fetch the market data
  const marketResponse = await fetch(
    `${process.env.NEXT_PUBLIC_URL_BASE}/api/markets/${market}?type=crypto`
  )
  if (!marketResponse.ok) {
    throw new Error(`Failed to fetch market data: ${marketResponse.statusText}`)
  }

  const marketRes = await marketResponse.json()

  const marketData = marketRes[0]

  if (marketData.grouped) {
    return <GroupDetailsPage market={marketData} />
  } else {
    const marketWithParentId = marketData.parentMarketId
      ? { ...marketData, id: marketData.id }
      : marketData
    return <DetailsPage market={marketWithParentId} />
  }
}
