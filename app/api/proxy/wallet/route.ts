import { NextRequest, NextResponse } from "next/server"
import { ethers } from "ethers"
import { WalletFactoryService } from "@/lib/contracts/wallet-factory"
import { ServerTransactionExecutor } from "@/lib/contracts/transaction-executer"

/**
 * API endpoint to get a user's wallet address
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userAddress = url.searchParams.get("address")

    if (!userAddress) {
      return new Response("User has no blockchain address", { status: 400 })
    }

    // Initialize wallet factory service
    const walletService = new WalletFactoryService()

    // Get the user's wallet address
    const walletAddress = await walletService.getWalletAddress(userAddress)

    // Return wallet information
    return NextResponse.json({
      userAddress,
      walletAddress,
    })
  } catch (error) {
    console.error("Error getting wallet address:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

/**
 * API endpoint to create a wallet via meta-transaction
 */
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

    // Verify the request is valid
    const isValid = await executor.verifyRequest(signedRequest)
    if (!isValid) {
      return new Response("Invalid signature", { status: 400 })
    }

    // Ensure the from address is the user's address
    const userAddress = signedRequest.from

    // Check if wallet already exists
    const existingWallet = await walletService.getWalletAddress(userAddress)
    if (existingWallet !== ethers.ZeroAddress) {
      return NextResponse.json({
        message: "Wallet already exists",
        walletAddress: existingWallet,
      })
    }

    // Execute the wallet creation transaction
    const result = await executor.executeTransaction(signedRequest)

    const newWalletAddress = await walletService.getWalletAddress(userAddress)
    // Return the result
    return NextResponse.json({
      message: "Wallet created successfully",
      transactionHash: result.tx,
      walletAddress: newWalletAddress,
    })
  } catch (error) {
    console.error("Error creating wallet:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
