import { ethers } from "ethers"
import { FEE_RATE_BPS } from "../config"

export function generateOrderSalt(): string {
  // Combine current timestamp with a random component
  const timestamp = BigInt(Date.now())
  const randomComponent = BigInt(Math.floor(Math.random() * 1000000))
  const result = (timestamp << BigInt(20)) | randomComponent
  return result.toString()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeOrderForHashing(order: any) {
  return {
    salt: BigInt(order.salt ?? generateOrderSalt()),
    maker: order.maker,
    signer: order.signer,
    taker: order.taker || ethers.ZeroAddress,
    tokenId: BigInt(order.tokenId),
    makerAmount: BigInt(order.makerAmount),
    takerAmount: BigInt(order.takerAmount),
    expiration: BigInt(order.expiration),
    nonce: BigInt(order.nonce || 0),
    feeRateBps: BigInt(order.feeRateBps || FEE_RATE_BPS),
    side:
      typeof order.side === "string"
        ? order.side === "BUY"
          ? 0
          : 1
        : Number(order.side),
    signatureType: Number(order.signatureType || 0),
    signature: order.signature || "0x",
  }
}
