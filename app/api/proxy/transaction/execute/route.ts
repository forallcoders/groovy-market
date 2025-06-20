import { NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"
import { ServerTransactionExecutor } from "@/lib/contracts/transaction-executer"
import { WalletFactoryService } from "@/lib/contracts/wallet-factory"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { request: signedRequest } = body

    if (!signedRequest) {
      return new Response("Missing signed request", { status: 400 })
    }

    // Initialize services
    const executor = new ServerTransactionExecutor()
    const walletService = new WalletFactoryService()

    // Verify the request is valid before executing
    const isValid = await executor.verifyRequest(signedRequest)
    if (!isValid) {
      return new Response("Invalid signature", { status: 400 })
    }

    // Check if the user's wallet exists
    const userAddress = signedRequest.from
    const walletAddress = await walletService.getWalletAddress(userAddress)

    // Ensure the target address (to) matches the user's wallet
    if (
      signedRequest.to.toLowerCase() !== walletAddress.toLowerCase() ||
      walletAddress === ethers.ZeroAddress
    ) {
      return new Response("Invalid target wallet address", { status: 400 })
    }
    // Execute the transaction
    const result = await executor.executeTransaction(signedRequest)

    // Return the transaction result
    return NextResponse.json(result)
  } catch (error) {
    console.dir({ error }, { depth: Infinity })
    return new Response("Internal Server Error", { status: 500 })
  }
}
