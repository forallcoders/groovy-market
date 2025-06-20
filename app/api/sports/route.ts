import { getSports } from "@/lib/sports/get-sports"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await getSports()
  return NextResponse.json(data)
}
