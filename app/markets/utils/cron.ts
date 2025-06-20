import { RELAYER_ADDRESS } from "@/lib/config"
import { generateOrderSalt } from "./order"
import { zeroAddress } from "viem"
import { SignatureType } from "@/types/Market"
import { publicClient } from "@/lib/wallet/public-client"
import { ctfExchangeContract } from "@/contracts/data/ctf-exchange"
import { normalizeOrderForHashing } from "@/lib/order/hash-order"
import { privateClient } from "@/lib/wallet/private-client"
import { ordersTable } from "@/lib/db/schema"
import { db } from "@/lib/db/client"
import { ethers } from "ethers"
import { ctfContract } from "@/contracts/data/ctf"
import { collateralContract } from "@/contracts/data/collateral"

const usdcDecimals = BigInt(6)

export async function createAndInsertDefaultOrders({
  marketId,
  conditionId,
  tokenId,
  usdcAmount,
}: {
  marketId: string
  conditionId: string
  tokenId: string
  usdcAmount: number
}) {
  const sharesAmount = BigInt(Math.floor((usdcAmount / 0.5) * 10 ** 6))
  const limitPrices = [0.49, 0.51]
  const orders = []

  for (const price of limitPrices) {
    const priceRaw = BigInt(Math.floor(price * 10 ** Number(usdcDecimals)))
    const makerAmount = (sharesAmount * priceRaw) / BigInt(10) ** usdcDecimals
    const takerAmount = sharesAmount

    const unsignedOrder = {
      salt: generateOrderSalt(),
      maker: RELAYER_ADDRESS,
      signer: RELAYER_ADDRESS,
      taker: zeroAddress,
      tokenId,
      makerAmount,
      takerAmount,
      expiration: BigInt(0),
      nonce: BigInt(0),
      feeRateBps: BigInt(0),
      side: 0,
      signatureType: SignatureType.EOA,
      signature: "0x" as `0x${string}`,
    }

    const hash = await publicClient.readContract({
      address: ctfExchangeContract.address,
      abi: ctfExchangeContract.abi,
      functionName: "hashOrder",
      args: [normalizeOrderForHashing(unsignedOrder)],
    })

    const signature = await privateClient.signMessage({
      message: { raw: hash as `0x${string}` },
    })

    orders.push({
      marketId,
      conditionId,
      tokenId,
      side: "BUY",
      type: "limit",
      price: price.toString(),
      shares: sharesAmount.toString(),
      makerAmount: makerAmount.toString(),
      takerAmount: takerAmount.toString(),
      feeRateBps: "0",
      expiration: 0,
      salt: unsignedOrder.salt.toString(),
      signature,
      signer: RELAYER_ADDRESS,
      orderHash: hash,
      maker: RELAYER_ADDRESS,
      status: "pending",
      orderType: "limit",
    })
  }

  await db.insert(ordersTable).values(orders as any)
}

export async function addInitialLiquidityToBlockchain({
  conditionId,
  usdcAmount,
}: {
  conditionId: string
  usdcAmount: number
}) {
  const amountBigInt = ethers.parseUnits(usdcAmount.toFixed(2), 6)

  const hash = await privateClient.writeContract({
    address: ctfContract.address,
    abi: ctfContract.abi,
    functionName: "splitPosition",
    args: [
      collateralContract.address,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      conditionId,
      [1, 2],
      amountBigInt,
    ],
  })

  await publicClient.waitForTransactionReceipt({ hash })
}
