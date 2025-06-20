import { CTF_EXCHANGE } from "@/lib/config"
import { useCallback, useState } from "react"
import { Address } from "viem"
import { anvil } from "viem/chains"
import { useAccount, useWalletClient } from "wagmi"

type MarketOrder = {
  salt: number
  maker: Address
  signer: Address
  taker: Address
  tokenId: string
  makerAmount: number
  takerAmount: number
  expiration: number
  nonce: number
  feeRateBps: number
  side: number // uint8
  signatureType: number
}

const DOMAIN = {
  name: "CTF Exchange",
  version: "1",
  chainId: anvil.id, // or use from config
  verifyingContract: CTF_EXCHANGE,
}

export const orderTypes = {
  Order: [
    { name: "salt", type: "uint256" },
    { name: "maker", type: "address" },
    { name: "signer", type: "address" },
    { name: "taker", type: "address" },
    { name: "tokenId", type: "string" },
    { name: "makerAmount", type: "uint256" },
    { name: "takerAmount", type: "uint256" },
    { name: "expiration", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "feeRateBps", type: "uint256" },
    { name: "side", type: "uint8" },
    { name: "signatureType", type: "uint8" },
  ],
} as const

export function useSignMarketOrder() {
  const { data: privateClient } = useWalletClient()
  const { address } = useAccount()
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const signMarketOrder = useCallback(
    async (order: Omit<MarketOrder, "user">) => {
      if (!privateClient || !address) {
        throw new Error("Wallet not connected")
      }

      setIsSigning(true)
      setError(null)

      try {
        const signature = await privateClient.signTypedData({
          domain: DOMAIN,
          types: orderTypes,
          primaryType: "Order",
          message: {
            ...order,
            makerAmount: BigInt(order.makerAmount),
            takerAmount: BigInt(order.takerAmount),
            expiration: BigInt(order.expiration),
            nonce: BigInt(order.nonce),
            feeRateBps: BigInt(order.feeRateBps),
            salt: BigInt(order.salt),
          },
        })

        return { signature, user: address }
      } catch (err) {
        setError(err as Error)
        return null
      } finally {
        setIsSigning(false)
      }
    },
    [privateClient, address]
  )

  return { signMarketOrder, isSigning, error }
}
