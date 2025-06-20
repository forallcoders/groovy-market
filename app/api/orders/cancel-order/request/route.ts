import { ctfExchangeContract } from "@/contracts/data/ctf-exchange"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { FEE_RATE_BPS } from "@/lib/config"
import { ethers } from "ethers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }
    const { order } = await request.json()

    const orderObject = {
      salt: order.salt,
      maker: order.maker,
      signer: order.signer,
      taker: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      tokenId: BigInt(order.tokenId),
      makerAmount: BigInt(order.makerAmount),
      takerAmount: BigInt(order.takerAmount),
      expiration: BigInt(order.expiration),
      nonce: BigInt(0),
      feeRateBps: BigInt(FEE_RATE_BPS),
      side: order.side === "BUY" ? 0 : 1,
      signatureType: 0,
      signature: order.signature as `0x${string}`,
    }

    const tokenInterface = new ethers.Interface(ctfExchangeContract.abi)
    const cancelOrderData = tokenInterface.encodeFunctionData("cancelOrder", [
      orderObject,
    ])

    // Create request to be forwarded
    const cancelRequest = {
      targetContract: ctfExchangeContract.address,
      amount: "0",
      data: cancelOrderData,
    }

    return NextResponse.json({
      request: cancelRequest,
    })
  } catch (error) {
    console.error("Error preparing approval data:", error)
    return NextResponse.json(
      { error: "Failed to prepare approval data" },
      { status: 500 }
    )
  }
}
