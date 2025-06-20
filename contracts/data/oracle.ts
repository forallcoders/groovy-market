import { ORACLE_RESOLVER } from "@/lib/config"
import data from "../json/oracle.json"

export const oracleResolverContract = {
  abi: data.abi,
  address: ORACLE_RESOLVER,
}
