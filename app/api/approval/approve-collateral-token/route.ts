import { collateralContract } from "@/contracts/data/collateral"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { ethers, MaxUint256 } from "ethers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }
    const body = await request.json()
    const { spenderAddress } = body
    if (!spenderAddress) {
      return new Response("Missing spenderAddress", { status: 400 })
    }

    // Create approval data for token
    const tokenInterface = new ethers.Interface(collateralContract.abi)

    // Create approve function call
    const approvalData = tokenInterface.encodeFunctionData("approve", [
      spenderAddress,
      MaxUint256,
    ])

    // Create request to be forwarded
    const forwardedRequest = {
      targetContract: collateralContract.address,
      amount: "0",
      data: approvalData,
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
