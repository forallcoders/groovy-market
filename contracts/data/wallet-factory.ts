import { WALLET_FACTORY } from "@/lib/config"
import data from "../json/wallet-factory.json"

export const walletFactoryContract = {
  abi: data.abi,
  address: WALLET_FACTORY,
}
