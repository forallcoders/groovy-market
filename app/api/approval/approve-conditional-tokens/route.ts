import { ctfContract } from "@/contracts/data/ctf"
import { ctfExchangeContract } from "@/contracts/data/ctf-exchange"
import { getAuthenticatedUser } from "@/lib/auth/auth-utils"
import { ethers } from "ethers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Create approval data for conditional tokens
    const tokenInterface = new ethers.Interface(ctfContract.abi)

    // Create setApprovalForAll function call
    const approvalData = tokenInterface.encodeFunctionData(
      "setApprovalForAll",
      [ctfExchangeContract.address, true]
    )

    // Create request to be forwarded
    const forwardedRequest = {
      targetContract: ctfContract.address,
      amount: "0",
      data: approvalData,
    }

    return NextResponse.json({
      request: forwardedRequest,
    })
  } catch (error) {
    console.error("Error preparing conditional tokens approval data:", error)
    return NextResponse.json(
      { error: "Failed to prepare approval data" },
      { status: 500 }
    )
  }
}
