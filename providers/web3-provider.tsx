"use client"
import {
  DynamicContextProvider,
  getAuthToken,
} from "@dynamic-labs/sdk-react-core"
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector"
import { createConfig, http, WagmiProvider } from "wagmi"
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider, signIn } from "next-auth/react"
import { sei, seiTestnet } from "wagmi/chains"
import { UserProvider } from "./user-provider"

const queryClient = new QueryClient()

const isProd = process.env.NEXT_PUBLIC_WORK_ENVIRONMENT === "production"

const config = createConfig({
  chains: isProd ? [sei] : [seiTestnet],
  multiInjectedProviderDiscovery: false,
  transports: {
    [sei.id]: http(),
    [seiTestnet.id]: http(),
  },
})

const seiMainnet = {
  chainId: 1329,
  chainName: "Sei Network",
  nativeCurrency: { name: "Sei", symbol: "SEI", decimals: 18 },
  rpcUrls: ["https://evm-rpc.sei-apis.com/"],
  blockExplorerUrls: ["https://seitrace.com"],
  iconUrls: [
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/sei/images/sei.svg",
  ],
  name: "Sei Mainnet",
  networkId: 1329,
  vanityName: "SEI Mainnet",
}
const seiTestnetConfig = {
  chainId: 1328,
  chainName: "Sei Testnet",
  nativeCurrency: { name: "Sei", symbol: "SEI", decimals: 18 },
  rpcUrls: ["https://evm-rpc-testnet.sei-apis.com/"],
  blockExplorerUrls: ["https://seitrace.com"],
  iconUrls: [
    "https://raw.githubusercontent.com/cosmos/chain-registry/master/sei/images/sei.svg",
  ],
  name: "Sei Testnet",
  networkId: 1328,
  vanityName: "SEI Testnet",
}

const FixedDynamicContextProvider = DynamicContextProvider as React.FC<
  React.PropsWithChildren<any>
>

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FixedDynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks: isProd ? [seiMainnet] : [seiTestnetConfig],
        },
        events: {
          onAuthSuccess: async () => {
            const authToken = getAuthToken()
            try {
              await signIn("credentials", {
                token: authToken,
                redirect: false,
              })
            } catch (err) {
              console.error("Error logging in", err)
            }
          },
        },
      }}
    >
      <div className="hidden"></div>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <SessionProvider basePath="/api/auth">
              <UserProvider>{children}</UserProvider>
            </SessionProvider>
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </FixedDynamicContextProvider>
  )
}
