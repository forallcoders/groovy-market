import { MARKET_CREATOR } from "@/lib/config"
import data from "../json/market-creator.json"

export const marketCreatorContract = {
  abi: data.abi,
  address: MARKET_CREATOR,
}
