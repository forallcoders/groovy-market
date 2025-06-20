"use client"
import { collateralContract } from "@/contracts/data/collateral"
import { ctfContract } from "@/contracts/data/ctf"
import { ctfExchangeContract } from "@/contracts/data/ctf-exchange"
import { FEE_RATE_BPS } from "@/lib/config"
import { generateOrderSalt } from "@/lib/order/hash-order"
import { publicClient } from "@/lib/wallet/public-client"
import { MaxUint256 } from "ethers"
import { useState } from "react"
import { zeroAddress } from "viem"

import {
  useAccount,
  useReadContract,
  useSignMessage,
  useWriteContract,
} from "wagmi"

export enum Side {
  BUY = 0,
  SELL = 1,
}

export enum SignatureType {
  EOA = 0,
  POLY_PROXY = 1,
  POLY_GNOSIS_SAFE = 2,
}

export enum OrderType {
  MARKET = 0,
  LIMIT = 1,
}

export interface Order {
  salt: bigint
  maker: `0x${string}`
  signer: `0x${string}`
  taker: `0x${string}`
  tokenId: bigint
  makerAmount: bigint
  takerAmount: bigint
  expiration: bigint
  nonce: bigint
  feeRateBps: bigint
  side: Side
  signatureType: SignatureType
  signature: `0x${string}`
  orderHash?: string
  filled?: boolean
  cancelled?: boolean
  pendingMatch?: boolean
  filledAmount?: bigint
  status?: string
  created_at?: string
  orderType?: OrderType
}

/**
 * Custom hook for creating orders with automatic matching when possible
 */
export function useOrderCreation() {
  const { address, isConnected } = useAccount()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)
  const { signMessageAsync } = useSignMessage()
  const { writeContractAsync } = useWriteContract()
  const { data: nonce } = useReadContract({
    address: ctfExchangeContract.address,
    abi: ctfExchangeContract.abi,
    functionName: "nonces",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // const { data: collateralBalance } = useReadContract({
  //   address: collateralContract.address,
  //   abi: collateralContract.abi,
  //   functionName: "balanceOf",
  //   args: address ? [address] : undefined,
  //   query: {
  //     enabled: !!address,
  //   },
  // })

  /**
   * Transfers ERC1155 tokens (outcome tokens) to the exchange for sell orders
   */
  const approveERC1155ToExchange = async () => {
    if (!address) return null

    try {
      const isApproved = await publicClient.readContract({
        address: ctfContract.address,
        abi: ctfContract.abi,
        functionName: "isApprovedForAll",
        args: [address, ctfExchangeContract.address],
      })

      if (!isApproved) {
        // Set approval for all CTF tokens
        const approvalTx = await writeContractAsync({
          address: ctfContract.address,
          abi: ctfContract.abi,
          functionName: "setApprovalForAll",
          args: [ctfExchangeContract.address, true],
        })

        // Wait for approval to be confirmed
        console.log("Waiting for approval transaction:", approvalTx)
      }
    } catch (err) {
      console.error("Error transferring ERC1155 tokens to exchange:", err)
      throw err
    }
  }

  /**
   * Transfers ERC20 tokens (collateral/USDC) to the exchange for buy orders
   */
  const approveERC20ToExchange = async (amount: string) => {
    if (!address) return null

    try {
      // Convert amount to BigInt with proper decimals
      // const amountBigInt = BigInt(amount)
      // Ensure we have approval for ERC20 tokens
      console.log({ amount })
      // Approve the exchange to spend collateral
      const approvalTx = await writeContractAsync({
        address: collateralContract.address,
        abi: collateralContract.abi,
        functionName: "approve",
        args: [ctfExchangeContract.address, MaxUint256],
      })

      // Wait for approval to be confirmed
      console.log("Waiting for ERC20 approval transaction:", approvalTx)
    } catch (err) {
      console.error("Error transferring ERC20 tokens to exchange:", err)
      throw err
    }
  }

  /**
   * Creates a signed order and submits it to the backend
   * For market creator BUY orders, skips token transfer since they already have balance
   * For all other orders, transfers appropriate tokens to the exchange
   */
  const createOrder = async (params: {
    tokenId: bigint
    marketId: string
    takerAmount: bigint
    makerAmount: bigint
    side: Side
    expiration?: number
    isMarketCreator?: boolean // Flag to identify market creator orders
    isLimitOrder?: boolean
  }) => {
    if (!isConnected || !address) {
      setError("Wallet not connected")
      return null
    }

    try {
      setIsCreating(true)
      setError(null)
      console.log({ params })

      // Token amounts calculation
      // let makerAmount = params.makerAmount
      // let takerAmount = params.takerAmount
      // let collateralAmount: string
      let transferTxHash: `0x${string}` | null = null
      let tokensTransferred = false

      // if (params.side === Side.BUY) {
      //   const collateralToSpend = params.takerAmount

      //   // For the order itself, we need makerAmount and takerAmount calculations
      //   if (params.makerAmount === "0" || parseFloat(params.makerAmount) <= 0) {
      //     throw new Error("Invalid price specified")
      //   }

      //   collateralAmount = collateralToSpend.toString()

      //   // Check if user has enough collateral (skip for market creator)
      //   if (!params.isMarketCreator) {
      //     if (
      //       collateralBalance &&
      //       (collateralBalance as bigint) < makerAmount
      //     ) {
      //       throw new Error(
      //         `Insufficient collateral balance. You need ${formatUnits(
      //           makerAmount,
      //           6
      //         )} USDC`
      //       )
      //     }
      //   }
      // } else {
      //   const receiveAmount = tokenAmount * tokenPrice
      //   makerAmount = parseUnits(tokenAmount.toString(), 6) // Tokens being sold
      //   takerAmount = parseUnits(receiveAmount.toString(), 6) // USDC to receive

      //   // Check if user has enough outcome tokens
      //   const tokenBalance = await publicClient.readContract({
      //     address: ctfContract.address,
      //     abi: ctfContract.abi,
      //     functionName: "balanceOf",
      //     args: [address, params.tokenId],
      //   })

      //   if (tokenBalance && (tokenBalance as bigint) < makerAmount) {
      //     throw new Error(
      //       `Insufficient token balance. You need ${formatUnits(
      //         makerAmount,
      //         6
      //       )} tokens`
      //     )
      //   }
      // }

      // Handle token transfers based on order type and market creator status
      if (params.side === Side.BUY && params.isMarketCreator) {
        // For market creator BUY orders, skip USDC transfer (they already deposited)
        console.log("Market creator BUY order - using initial USDC balance")
        tokensTransferred = true
        transferTxHash = "MARKET_CREATOR_INITIAL_BALANCE" as `0x${string}`
      } else {
        // For all SELL orders and non-market-creator BUY orders
        try {
          if (params.side === Side.BUY) {
            await approveERC20ToExchange(params.makerAmount.toString())
          } else {
            await approveERC1155ToExchange()
          }
          tokensTransferred = true
        } catch (transferError) {
          console.error("Token transfer failed:", transferError)
          throw new Error(
            `Failed to transfer tokens to exchange: ${
              (transferError as Error).message
            }`
          )
        }
      }

      let expirationTimestamp: bigint

      if (params.expiration) {
        expirationTimestamp = BigInt(params.expiration)
        console.log(
          `Setting limit order expiration: ${new Date(
            Number(expirationTimestamp) * 1000
          ).toISOString()}`
        )
      } else {
        // Default expiration (24 hours)
        expirationTimestamp = BigInt(0)
      }

      const unsignedOrder = {
        salt: generateOrderSalt(),
        maker: address as `0x${string}`,
        signer: address as `0x${string}`,
        taker: zeroAddress,
        tokenId: params.tokenId,
        makerAmount: params.makerAmount,
        takerAmount: params.takerAmount,
        expiration: expirationTimestamp,
        nonce: nonce || BigInt(0),
        feeRateBps: BigInt(FEE_RATE_BPS),
        side: params.side,
        signatureType: SignatureType.EOA,
        signature: "0x" as `0x${string}`,
      }

      const hashResult = await fetch("/api/orders/hash-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exchangeAddress: ctfExchangeContract.address,
          order: {
            ...unsignedOrder,
            salt: unsignedOrder.salt.toString(),
            makerAmount: unsignedOrder.makerAmount.toString(),
            takerAmount: unsignedOrder.takerAmount.toString(),
            expiration: unsignedOrder.expiration.toString(),
            nonce: unsignedOrder.nonce.toString(),
            feeRateBps: unsignedOrder.feeRateBps.toString(),
            tokenId: unsignedOrder.tokenId.toString(),
          },
          isLimitOrder: params.isLimitOrder || false,
        }),
      })

      if (!hashResult.ok) {
        throw new Error("Failed to get order hash")
      }

      const { hash } = await hashResult.json()

      const signature = await signMessageAsync({
        message: { raw: hash as `0x${string}` },
      })

      const signedOrder = {
        ...unsignedOrder,
        signature,
      }
      const path = params.isLimitOrder
        ? "/api/orders/limit-order"
        : "/api/orders/market-order"
      const dbResult = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order: {
            ...unsignedOrder,
            salt: unsignedOrder.salt.toString(),
            makerAmount: unsignedOrder.makerAmount.toString(),
            takerAmount: unsignedOrder.takerAmount.toString(),
            expiration: unsignedOrder.expiration.toString(),
            nonce: unsignedOrder.nonce.toString(),
            feeRateBps: unsignedOrder.feeRateBps.toString(),
            tokenId: unsignedOrder.tokenId.toString(),
          },
          signature,
          marketId: params.marketId,
          checkForMatches: true,
          tokensTransferred: tokensTransferred,
          transferTxHash: transferTxHash ? transferTxHash : undefined,
          isMarketCreator: params.isMarketCreator || false,
          isLimitOrder: params.isLimitOrder || false,
        }),
      })

      if (!dbResult.ok) {
        throw new Error("Failed to save order to database")
      }

      const { orderHash, pendingMatch } = await dbResult.json()

      const finalOrder = {
        ...signedOrder,
        orderHash,
        pendingMatch: Boolean(pendingMatch),
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCreatedOrder(finalOrder as any)
      return finalOrder
    } catch (err) {
      console.error("Error creating order:", err)
      setError(err instanceof Error ? err.message : "Failed to create order")
      return null
    } finally {
      setIsCreating(false)
    }
  }

  /**
   * Create a buy order for YES tokens
   */
  const createBuyOrder = (
    marketYesTokenId: bigint,
    marketId: string,
    takerAmount: bigint,
    makerAmount: bigint,
    isMarketCreator?: boolean,
    expiration?: number,
    isLimitOrder: boolean = false
  ) => {
    return createOrder({
      tokenId: marketYesTokenId,
      marketId,
      takerAmount,
      makerAmount,
      side: Side.BUY,
      isMarketCreator,
      expiration,
      isLimitOrder,
    })
  }

  /**
   * Create a sell order for YES tokens
   */
  const createSellOrder = (
    marketYesTokenId: bigint,
    marketId: string,
    takerAmount: bigint,
    makerAmount: bigint,
    isMarketCreator?: boolean,
    expiration?: number,
    isLimitOrder: boolean = false
  ) => {
    return createOrder({
      tokenId: marketYesTokenId,
      marketId,
      takerAmount,
      makerAmount,
      side: Side.SELL,
      isMarketCreator,
      expiration,
      isLimitOrder,
    })
  }

  /**
   * Create a buy order for NO tokens
   */
  const createBuyNoOrder = (
    marketNoTokenId: bigint,
    marketId: string,
    takerAmount: bigint,
    makerAmount: bigint,
    isMarketCreator?: boolean,
    expiration?: number,
    isLimitOrder: boolean = false
  ) => {
    return createOrder({
      tokenId: marketNoTokenId,
      marketId,
      takerAmount,
      makerAmount,
      side: Side.BUY,
      isMarketCreator,
      expiration,
      isLimitOrder,
    })
  }

  /**
   * Create a sell order for NO tokens
   */
  const createSellNoOrder = (
    marketNoTokenId: bigint,
    marketId: string,
    takerAmount: bigint,
    makerAmount: bigint,
    isMarketCreator?: boolean,
    expiration?: number,
    isLimitOrder: boolean = false
  ) => {
    return createOrder({
      tokenId: marketNoTokenId,
      marketId,
      takerAmount,
      makerAmount,
      side: Side.SELL,
      isMarketCreator,
      expiration,
      isLimitOrder,
    })
  }

  return {
    isCreating,
    error,
    createdOrder,
    createBuyOrder,
    createSellOrder,
    createBuyNoOrder,
    createSellNoOrder,
    reset: () => {
      setCreatedOrder(null)
      setError(null)
    },
  }
}
