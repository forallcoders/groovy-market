import { getMatches } from "@/lib/matches/get-matches"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // get serach params from request
  const searchParams = request.nextUrl.searchParams
  const leagueId = searchParams.get("leagueId")
  const sportType = searchParams.get("sport")
  if (!sportType) {
    return NextResponse.json(
      { error: "Missing leagueId or sportType" },
      { status: 400 }
    )
  }
  const date = new Date()
  date.setDate(date.getDate() - 1)
  const reducedDate = date.toISOString().split("T")[0]

  const data = await getMatches({
    leagueId: leagueId ? parseInt(leagueId!) : undefined,
    startDate: reducedDate,
    sportType,
  })
  return NextResponse.json(data)
}
