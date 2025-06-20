"use client"

import { ctfContract } from "@/contracts/data/ctf"
import { useUserContext } from "@/providers/user-provider"

import { zeroAddress } from "viem"
import { useReadContract } from "wagmi"

export function useConditionalTokenBalance(
  yesTokenId?: string,
  noTokenId?: string
) {
  const { proxyAddress } = useUserContext()
  const userAddress = proxyAddress
    ? (proxyAddress as `0x${string}`)
    : zeroAddress

  const { data: yesTokenBalance, refetch: refetchYesTokenBalance } =
    useReadContract({
      address: ctfContract.address,
      abi: ctfContract.abi,
      functionName: "balanceOf",
      args: [userAddress, yesTokenId],
    })
  const { data: noTokenBalance, refetch: refetchNoTokenBalance } =
    useReadContract({
      address: ctfContract.address,
      abi: ctfContract.abi,
      functionName: "balanceOf",
      args: [userAddress, noTokenId],
    })

  return {
    yesTokenBalance: yesTokenBalance as bigint,
    noTokenBalance: noTokenBalance as bigint,
    refetchYesTokenBalance,
    refetchNoTokenBalance,
  }
}
