import { formatOrderForApi, generateOrderSalt } from "./order"
import { FEE_RATE_BPS } from "@/lib/config"
import { SignatureType } from "@/types/Market"
import { zeroAddress } from "viem"

export async function handleLimitOrderDirect({
  proxyAddress,
  address,
  signMessageAsync,
  approveERC1155,
  refetchAll,
  refetchEverything,
  tokenId,
  side,
  marketId,
  conditionId,
  sharesAmount,
  limitPrice,
  expiration = 0,
}: {
  proxyAddress: string
  address: string
  signMessageAsync: (params: {
    message: { raw: `0x${string}` }
  }) => Promise<string>
  approveERC1155: () => Promise<boolean>
  refetchAll: () => void
  refetchEverything?: () => Promise<void>
  tokenId: string
  side: "BUY" | "SELL"
  marketId: string
  conditionId: string
  sharesAmount: string
  limitPrice: string
  expiration?: number
}): Promise<boolean> {
  const orderPrice = parseFloat(limitPrice)
  const limitTakerAmount = Math.floor(
    Number(sharesAmount) * orderPrice * 10 ** 6
  )
  const sharesAmountInt = Math.floor(Number(sharesAmount) * 10 ** 6)

  const takerAmount =
    side === "BUY" ? BigInt(sharesAmountInt) : BigInt(limitTakerAmount)
  const makerAmount =
    side === "BUY" ? BigInt(limitTakerAmount) : BigInt(sharesAmountInt)

  if (side === "SELL") {
    await approveERC1155()
  }

  const unsignedOrder = {
    salt: generateOrderSalt(),
    maker: proxyAddress,
    signer: address,
    taker: zeroAddress,
    tokenId,
    makerAmount,
    takerAmount,
    expiration,
    nonce: BigInt(0),
    feeRateBps: BigInt(FEE_RATE_BPS),
    side: side === "BUY" ? 0 : 1,
    signatureType: SignatureType.EOA,
    signature: "0x" as `0x${string}`,
  }

  const hashResult = await fetch("/api/orders/hash-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order: formatOrderForApi(unsignedOrder) }),
  })

  if (!hashResult.ok) return false
  const { hash } = await hashResult.json()

  const signature = await signMessageAsync({ message: { raw: hash } })
  const dbResult = await fetch("/api/orders/limit-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order: formatOrderForApi(unsignedOrder),
      signature,
      marketId,
      conditionId,
      price: limitPrice,
    }),
  })

  if (!dbResult.ok) return false

  await refetchAll()
  if (refetchEverything) {
    await refetchEverything()
  }

  return true
}
