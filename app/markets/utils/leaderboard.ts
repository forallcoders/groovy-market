export function getStartDateFromRange(range: string): Date | null {
  const now = new Date()
  switch (range) {
    case "day":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case "week":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    case "month":
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    default:
      return null
  }
}
