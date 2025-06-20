import { format } from "date-fns"

export function formatBigNumber(value: string | number): string {
  const num = Number(value)
  if (num >= 1_000_000_000_000)
    return `${(num / 1_000_000_000_000).toFixed(1)}T`
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(0)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(0)}M`
  return num.toString()
}

export function groupMarketsByDate(markets: any[]) {
  const groups: Record<string, any[]> = {}

  for (const market of markets) {
    const dateKey = format(new Date(market.predictionDate), "yyyy-MM-dd")
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(market)
  }

  return Object.entries(groups)
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
