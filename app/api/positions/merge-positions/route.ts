import { collateralContract } from "@/contracts/data/collateral"
import { ctfContract } from "@/contracts/data/ctf"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { ethers } from "ethers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }
    // Parse request body
    const body = await request.json()
    const { amount, conditionId, yesTokenId, noTokenId } = body
    console.log({ amount, conditionId, yesTokenId, noTokenId })
    if (!amount || amount <= 0 || !conditionId || !yesTokenId || !noTokenId) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    // Prepare data for merge operation
    const ctInterface = new ethers.Interface(ctfContract.abi)

    // Format amount with proper decimals (6 for outcome tokens)
    const amountBigInt = ethers.parseUnits(amount.toString(), 6)

    // Create partition array based on which token the user is merging
    const partition = [1, 2]
    // Encode the mergePositions function call
    const mergeData = ctInterface.encodeFunctionData("mergePositions", [
      collateralContract.address, // collateralToken
      "0x0000000000000000000000000000000000000000000000000000000000000000", // parentCollectionId (0 for root)
      conditionId, // conditionId
      partition, // partition
      amountBigInt, // amount
    ])

    // Create request to be forwarded
    const mergeDataRequest = {
      targetContract: ctfContract.address,
      amount: "0",
      data: mergeData,
    }

    return NextResponse.json({
      request: mergeDataRequest,
    })
  } catch (error) {
    console.error("Error preparing merge token data:", error)
    return NextResponse.json(
      { error: "Failed to prepare merge token data" },
      { status: 500 }
    )
  }
}
