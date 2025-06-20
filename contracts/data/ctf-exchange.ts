import { CTF_EXCHANGE } from "@/lib/config"
import data from "../json/ctf-exchange.json"

export const ctfExchangeContract = {
  abi: data.abi,
  address: CTF_EXCHANGE,
}
