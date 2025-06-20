import { getLeagues } from "@/lib/leagues/get-leagues"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sportType = searchParams.get("sport") ?? ""
  const data = await getLeagues(sportType)
  return NextResponse.json(data)
}
