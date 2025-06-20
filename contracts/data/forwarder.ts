import { FORWARDER } from "@/lib/config"
import data from "../json/forwarder.json"

export const forwarderContract = {
  abi: data.abi,
  address: FORWARDER,
}
