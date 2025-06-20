import { ctfExchangeContract } from "@/contracts/data/ctf-exchange"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { normalizeOrderForHashing } from "@/lib/order/hash-order"
import { publicClient } from "@/lib/wallet/public-client"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }
    const body = await request.json()
    const { order } = body

    if (!order) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      )
    }

    const hash = await publicClient.readContract({
      address: ctfExchangeContract.address,
      abi: ctfExchangeContract.abi,
      functionName: "hashOrder",
      args: [normalizeOrderForHashing(order)],
    })

    return NextResponse.json({ hash })
  } catch (error) {
    console.error("Error getting order hash:", error)
    return NextResponse.json(
      { message: "Error getting order hash", error: String(error) },
      { status: 500 }
    )
  }
}
