import MarketsLayout from "../components/markets-layout"
import { getLeagues } from "@/lib/leagues/get-leagues"

export default async function MarketListingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const leagues = await getLeagues()

  return <MarketsLayout initialLeagues={leagues}>{children}</MarketsLayout>
}
