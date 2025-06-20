export type Sport = {
  id: number
  name: string
  description: string
  active: boolean
  created_at: string
  updated_at: string
  canDraw: boolean
}

export type League = {
  id: string
  sport_api_type: string
  sport_api_league_id: number
  name: string
  type: "league" | "cup"
  logo: string
  sport_api_country_id: number
  season: string
  start_at: string
  end_at: string
  short_name?: string
}

export interface Team {
  name: string
  shortName: string
  logo: string
  record: string
  prob?: number
}

export interface Game {
  id: string
  time: string
  volume: string
  team1: Team
  team2: Team
  draw?: Team
  odds: {
    team1: string
    draw?: string
    team2: string
  }
}

export interface LeagueWithGame {
  logo: string
  games: Game[]
}

export interface LeagueWithGameData {
  [key: string]: LeagueWithGame
}
