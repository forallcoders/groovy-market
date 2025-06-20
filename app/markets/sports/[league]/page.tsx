"use client"

import { useMarketContext } from "@/providers/market-provider"
import { slugify } from "@/utils/slugify"
import DynamicMarketsList from "../../components/dynamic-list"

export default function MarketsSportsPage() {
  const { leagueName, leagues } = useMarketContext()
  if (!leagueName) {
    return null
  }
  const league = leagues.find((league) => slugify(league.name) === leagueName)
  if (!league) {
    return null
  }

  return (
    <DynamicMarketsList
      category="sports"
      league={league.name}
      icon={league?.logo ?? ""}
    />
  )
}
