import { getLeagues } from "@/lib/leagues/get-leagues"
import MarketsSportsLayout from "../../components/sports-layout"

interface Props {
  children: React.ReactNode
  params: Promise<{ league: string }>
}

export default async function SportsLayout({ children, params }: Props) {
  const { league } = await params

  const leagues = await getLeagues()
  return (
    <MarketsSportsLayout
      initialLeagueName={league}
      initialLeagues={[...leagues]}
    >
      {children}
    </MarketsSportsLayout>
  )
}
