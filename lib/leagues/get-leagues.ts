import { League } from "@/types/Sports"
import axios from "axios"
import { MATCHES_BASE_URL } from "../config"

type LeagueResponse = {
  current_page: number
  size: number
  total_data: number
  total_page: number
  items: League[]
}

export async function getLeagues(sport?: string): Promise<League[]> {
  try {
    const { data } = await axios.get<LeagueResponse>(
      `${MATCHES_BASE_URL}/api/leagues${sport ? `?sport_type=${sport}` : ""}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MATCHES_SECRET_TOKEN}`,
        },
      }
    )
    return data.items.map((league) => ({
      ...league,
    }))
  } catch (error) {
    console.error("Error fetching leagues:", error)
    return []
  }
}
