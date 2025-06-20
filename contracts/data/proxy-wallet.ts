import { zeroAddress } from "viem"
import data from "../json/wallet-proxy.json"

export const proxyWalletContract = {
  abi: data.abi,
  address: zeroAddress,
}
