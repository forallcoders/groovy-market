/* eslint-disable @typescript-eslint/no-explicit-any */
import { publicClient } from "@/lib/wallet/public-client"
import { ctfExchangeContract } from "@/contracts/data/ctf-exchange"
import { recoverMessageAddress } from "viem"

export interface OrderValidationResult {
  isValid: boolean
  error?: string
  details?: string
}

/**
 * Validates an order signature and basic order parameters
 * @param order The order object to validate
 * @param signature The signature to validate
 * @returns A validation result object with isValid flag and optional error details
 */
export async function validateOrderSignature(
  order: any,
  signature: string
): Promise<OrderValidationResult> {
  try {
    // Step 1: Generate the order hash
    const orderHash = await publicClient.readContract({
      address: ctfExchangeContract.address,
      abi: ctfExchangeContract.abi,
      functionName: "hashOrder",
      args: [order],
    })

    // Step 2: Verify the signature against the hash
    const recoveredAddress = await recoverMessageAddress({
      message: { raw: orderHash as `0x${string}` },
      signature: signature as `0x${string}`,
    })
    console.log({ recoveredAddress })
    // Step 3: Ensure the recovered address matches the signer in the order
    if (recoveredAddress.toLowerCase() !== order.signer.toLowerCase()) {
      return {
        isValid: false,
        error: "Invalid signature",
        details: "Signer address does not match recovered address",
      }
    }

    // Step 4: Check if the order has expired
    if (isOrderExpired(order.expiration)) {
      return {
        isValid: false,
        error: "Order expired",
        details: "The order's expiration timestamp has passed",
      }
    }

    // All validations passed
    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: "Validation error",
      details: (error as Error).message,
    }
  }
}

function isOrderExpired(expiration: number | bigint | string): boolean {
  // An expiration of 0 means the order never expires
  if (expiration === 0 || expiration === BigInt(0) || expiration === "0")
    return false

  // Compare the expiration timestamp with the current time
  const currentTime = Math.floor(Date.now() / 1000)
  return Number(expiration) < currentTime
}
