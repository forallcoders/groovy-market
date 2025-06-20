import { Sport } from "@/types/Sports"
import axios from "axios"
import { MATCHES_BASE_URL } from "../config"

type SportResponse = {
  current_page: number
  size: number
  total_data: number
  total_page: number
  items: Sport[]
}

export async function getSports(): Promise<Sport[]> {
  try {
    const { data } = await axios.get<SportResponse>(
      `${MATCHES_BASE_URL}/api/sports`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MATCHES_SECRET_TOKEN}`,
        },
      }
    )
    return data.items.map((sport) => ({
      ...sport,
    }))
  } catch (error) {
    console.error("Error fetching sports:", error)
    return []
  }
}
