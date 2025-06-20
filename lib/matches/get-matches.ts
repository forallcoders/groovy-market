import axios from "axios"
import { MATCHES_BASE_URL } from "../config"

type MatchResponse = {
  current_page: number
  size: number
  total_data: number
  total_page: number
  items: any[]
}

export async function getMatches(params?: {
  sportType?: string
  status?: string
  leagueId?: number
  startDate?: string
  endDate?: string
}): Promise<any[]> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.sportType) queryParams.append("sport_type", params?.sportType)
    if (params?.status) queryParams.append("status", params?.status)
    if (params?.leagueId)
      queryParams.append("league_id", params?.leagueId.toString())
    if (params?.startDate) queryParams.append("start_date", params?.startDate)
    if (params?.endDate) queryParams.append("end_date", params?.endDate)

    const { data } = await axios.get<MatchResponse>(
      `${MATCHES_BASE_URL}/api/games?${queryParams.toString()}&status=not_started`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MATCHES_SECRET_TOKEN}`,
        },
      }
    )

    return data.items.map((match) => ({
      ...match,
    }))
  } catch (error) {
    console.error("Error fetching games:", error)
    return []
  }
}
