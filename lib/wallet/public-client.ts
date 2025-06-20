import { createPublicClient, http } from "viem"

import { sei, seiTestnet } from "viem/chains"
const workEnvironment = process.env.NEXT_PUBLIC_WORK_ENVIRONMENT

export const publicClient = createPublicClient({
  chain: workEnvironment === "production" ? sei : seiTestnet,
  transport: http(process.env.RPC_URL),
})
