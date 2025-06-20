export type MarketStatus = "pending" | "created" | "contested" | "resolved"

export type MarketInfo = {
  id: string
  title: string
  description: string
  endDate: string
  volume: number
  createdAt: string
  updatedAt: string
  conditionId: string
  yesTokenId: string
  noTokenId: string
  status: MarketStatus
  data: any
  bestPrices?: any
}

export type OrderType = "market" | "limit" | "split" | "merge"

export type TradeType = "BUY" | "SELL"

export type TokenOption = "YES" | "NO"

export type MarketPanelVariant = "default" | "teamAbbreviations" | "minimal"

export interface TokenLabels {
  YES: string
  NO: string
}

export interface UnsignedOrder {
  salt: bigint
  maker: string
  signer: string
  taker: string
  tokenId: string | undefined
  makerAmount: bigint | undefined
  takerAmount: bigint | undefined
  expiration: number
  nonce: bigint
  feeRateBps: bigint
  side: number
  signatureType: SignatureType
  signature: `0x${string}`
}

export enum SignatureType {
  EOA = 0,
}
