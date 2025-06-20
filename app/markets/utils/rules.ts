import { formatDate } from "@/utils/dates"
import { formatBigNumber } from "@/utils/market"
import { formatCondition } from "./condition"

function formatMetricLabel(
  metric: string,
  homeTeam: string,
  awayTeam: string
): string {
  const homePrefix = "home"
  const awayPrefix = "away"

  const capitalize = (word: string) =>
    word.charAt(0).toUpperCase() + word.slice(1)

  if (metric.startsWith(homePrefix)) {
    const suffix = capitalize(metric.slice(homePrefix.length))
    return `${homeTeam} ${suffix}`
  } else if (metric.startsWith(awayPrefix)) {
    const suffix = capitalize(metric.slice(awayPrefix.length))
    return `${awayTeam} ${suffix}`
  }

  return capitalize(metric)
}

export function generateRulesText(marketData: any) {
  if (
    marketData.value &&
    marketData.condition &&
    marketData.metric &&
    marketData.predictionDate &&
    marketData.home_team_name &&
    marketData.away_team_name
  ) {
    const metricLabel = formatMetricLabel(
      marketData.metric,
      marketData.home_team_name,
      marketData.away_team_name
    )

    return `The market will resolve if the ${metricLabel} is ${formatCondition(
      marketData.condition
    )} ${marketData.value} on ${formatDate({
      dateString: marketData.predictionDate,
    })}`
  }

  if (!marketData?.outcome || !marketData?.condition) {
    return "Market resolution criteria unavailable."
  }

  const {
    outcome,
    condition,
    primaryCurrency,
    secondaryCurrency,
    predictionDate,
  } = marketData

  const baseKey = outcome.replace(/-([a-z])/g, (_: any, letter: any) =>
    letter.toUpperCase()
  )

  const minValue = marketData[baseKey]
  const maxValue = marketData[`${baseKey}Max`]
  const singleValue = marketData.value || minValue

  const formattedMin = minValue
    ? formatBigNumber(Number(minValue)).toLocaleString()
    : null
  const formattedMax = maxValue
    ? formatBigNumber(Number(maxValue)).toLocaleString()
    : null
  const formattedSingle = singleValue
    ? formatBigNumber(Number(singleValue)).toLocaleString()
    : null

  switch (condition) {
    case "greater-than":
      return `The market will resolve if the price of ${primaryCurrency.toUpperCase()} is greater than ${formattedSingle} ${secondaryCurrency.toUpperCase()} on ${formatDate(
        { dateString: predictionDate }
      )} UTC based on CoinGecko.`
    case "lower-than":
      return `The market will resolve if the price of ${primaryCurrency.toUpperCase()} is lower than ${formattedSingle} ${secondaryCurrency.toUpperCase()} on ${formatDate(
        { dateString: predictionDate }
      )} UTC based on CoinGecko.`
    case "in-between":
      if (formattedMin && formattedMax) {
        return `The market will resolve if the price of ${primaryCurrency.toUpperCase()} is between ${formattedMin} and ${formattedMax} ${secondaryCurrency.toUpperCase()} on ${formatDate(
          { dateString: predictionDate }
        )} UTC based on CoinGecko.`
      } else {
        return "Market resolution criteria unavailable (missing range values)."
      }
    default:
      return "Market resolution criteria unavailable."
  }
}
