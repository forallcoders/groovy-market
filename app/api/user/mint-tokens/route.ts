import { collateralContract } from "@/contracts/data/collateral"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { ethers } from "ethers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }
    const body = await request.json()
    const { proxyWallet } = body

    if (!proxyWallet) {
      return new Response("Missing proxy wallet", { status: 400 })
    }

    // Create collateral interface
    const collateralInterface = new ethers.Interface(collateralContract.abi)

    const amount = ethers.parseUnits("1000", 6)

    // Create collateral function call
    const mintData = collateralInterface.encodeFunctionData("mint", [
      proxyWallet,
      amount,
    ])

    // Create request to be forwarded
    const forwardedRequest = {
      targetContract: collateralContract.address,
      amount: "0",
      data: mintData,
    }

    return NextResponse.json({
      request: forwardedRequest,
    })
  } catch (error) {
    console.error("Error preparing approval data:", error)
    return NextResponse.json(
      { error: "Failed to prepare approval data" },
      { status: 500 }
    )
  }
}
