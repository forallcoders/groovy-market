import { collateralContract } from "@/contracts/data/collateral"
import { ctfContract } from "@/contracts/data/ctf"
import { marketCreatorContract } from "@/contracts/data/market-creator"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { publicClient } from "@/lib/wallet/public-client"
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
    const { amount, marketId } = body

    const marketData = await publicClient.readContract({
      address: marketCreatorContract.address,
      abi: marketCreatorContract.abi,
      functionName: "getMarketDataByQuestion",
      args: [marketId],
    })
    const [conditionId] = marketData as any

    if (!amount || amount <= 0 || !marketId) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    // Get provider and contract to check condition state
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
    const ctContract = new ethers.Contract(
      ctfContract.address,
      ctfContract.abi,
      provider
    )

    // Check if the condition is prepared
    const outcomeSlotCount = await ctContract.getOutcomeSlotCount(conditionId)
    if (outcomeSlotCount.toString() === "0") {
      return NextResponse.json(
        { error: "Condition not prepared yet" },
        { status: 400 }
      )
    }

    // Format amount with proper decimals (6 for USDC)
    const amountBigInt = ethers.parseUnits(amount.toString(), 6)

    // Check user balance
    const tokenContract = new ethers.Contract(
      collateralContract.address,
      collateralContract.abi,
      provider
    )
    const balance = await tokenContract.balanceOf(user.proxyWallet)

    if (balance < amountBigInt) {
      return NextResponse.json(
        {
          error: "Insufficient balance",
          balance: ethers.formatUnits(balance, 6),
        },
        { status: 400 }
      )
    }

    // Check allowance
    const allowance = await tokenContract.allowance(
      user.proxyWallet,
      ctfContract.address
    )

    if (allowance < amountBigInt) {
      return NextResponse.json(
        {
          error: "Insufficient allowance",
          allowance: ethers.formatUnits(allowance, 6),
          required: ethers.formatUnits(amountBigInt, 6),
          needsApproval: true,
        },
        { status: 400 }
      )
    }

    const partition = [1, 2] // Binary outcomes - 1 for YES, 2 for NO

    // Encode the splitPosition function call
    const ctInterface = new ethers.Interface(ctfContract.abi)
    const splitData = ctInterface.encodeFunctionData("splitPosition", [
      collateralContract.address, // collateralToken
      "0x0000000000000000000000000000000000000000000000000000000000000000", // parentCollectionId (0 for root)
      conditionId, // conditionId
      partition, // partition
      amountBigInt, // amount
    ])

    // Create request to be forwarded
    const splitRequest = {
      targetContract: ctfContract.address,
      amount: "0",
      data: splitData,
    }
    console.log({ splitRequest })
    return NextResponse.json({
      request: splitRequest,
    })
  } catch (error) {
    console.dir({ error }, { depth: Infinity })
    return NextResponse.json(
      {
        error: "Failed to prepare split token data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
