import { redirect } from "next/navigation"

export async function GET() {
  return redirect(`/markets/sports/uefa-champions-league`)
}
