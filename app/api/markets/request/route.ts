import { marketCreatorContract } from "@/contracts/data/market-creator"
import { oracleResolverContract } from "@/contracts/data/oracle"
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
    const { params, isGrouped } = body

    if (!params) {
      return new Response("Missing params", { status: 400 })
    }

    // Create market interface
    const marketCreatorInterface = new ethers.Interface(
      marketCreatorContract.abi
    )
    const functionName = isGrouped ? "createMultipleMarkets" : "createMarket"
    // Create market function call
    const createMarketData = marketCreatorInterface.encodeFunctionData(
      functionName,
      [params, oracleResolverContract.address]
    )

    // Create request to be forwarded
    const forwardedRequest = {
      targetContract: marketCreatorContract.address,
      amount: "0",
      data: createMarketData,
    }

    return NextResponse.json({
      request: forwardedRequest,
    })
  } catch (error) {
    console.error("Error preparing creating market data:", error)
    return NextResponse.json(
      { error: "Failed to prepare creating market data" },
      { status: 500 }
    )
  }
}
