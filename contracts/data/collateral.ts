import { MOCK_USDC } from "@/lib/config"
import data from "../json/mock-erc20.json"

export const collateralContract = {
  abi: data.abi,
  address: MOCK_USDC,
}
