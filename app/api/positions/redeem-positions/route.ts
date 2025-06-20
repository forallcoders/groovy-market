import { collateralContract } from "@/contracts/data/collateral"
import { ctfContract } from "@/contracts/data/ctf"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { ethers } from "ethers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { conditionId, outcome } = body

    if (!conditionId || !outcome) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    // Prepare data for redeem operation
    const ctInterface = new ethers.Interface(ctfContract.abi)

    // Encode the redeemPositions function call
    const redeemData = ctInterface.encodeFunctionData("redeemPositions", [
      collateralContract.address,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      conditionId,
      [BigInt(outcome)],
    ])

    // Create request to be forwarded
    const redeemDataRequest = {
      targetContract: ctfContract.address,
      amount: "0",
      data: redeemData,
    }

    return NextResponse.json({
      request: redeemDataRequest,
    })
  } catch (error) {
    console.error("Error preparing redeem token data:", error)
    return NextResponse.json(
      { error: "Failed to prepare redeem token data" },
      { status: 500 }
    )
  }
}
