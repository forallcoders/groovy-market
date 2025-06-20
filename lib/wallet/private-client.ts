import { RELAYER_PRIVATE_KEY } from "@/lib/config"
import { createWalletClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sei, seiTestnet } from "viem/chains"

export const relayerAccount = privateKeyToAccount(RELAYER_PRIVATE_KEY)
const workEnvironment = process.env.NEXT_PUBLIC_WORK_ENVIRONMENT
export const privateClient = createWalletClient({
  account: relayerAccount,
  chain: workEnvironment === "production" ? sei : seiTestnet,
  transport: http(process.env.RPC_URL),
})
