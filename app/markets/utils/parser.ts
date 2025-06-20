function formatProbFloor(n: number) {
  return Math.floor(n * 100) / 100
}

export function getOdds(bestPrices?: any) {
  const yes = bestPrices?.yesBestAsk ?? 0.5
  const probYes = formatProbFloor(yes * 100)
  const probNo = formatProbFloor((1 - yes) * 100)

  return {
    yes: {
      value: `${probYes} ¢`,
      prob: probYes.toFixed(2),
    },
    no: {
      value: `${probNo} ¢`,
      prob: probNo.toFixed(2),
    },
  }
}
