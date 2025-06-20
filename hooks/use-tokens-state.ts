import { useState } from "react"
import { useGaslessTransactions } from "./use-gasless-client"
import { useBalance, useReadContract } from "wagmi"
import { collateralContract } from "@/contracts/data/collateral"
import { ctfExchangeContract } from "@/contracts/data/ctf-exchange"
import { useUserContext } from "@/providers/user-provider"
import { erc20Abi, zeroAddress } from "viem"
import { useToast } from "@/hooks/use-toast"
import { ctfContract } from "@/contracts/data/ctf"

export function useTokensState({
  spenderAddress = ctfExchangeContract.address,
}: {
  spenderAddress?: `0x${string}`
}) {
  const [isApproving, setIsApproving] = useState(false)
  const { proxyAddress } = useUserContext()
  const { executeTransaction } = useGaslessTransactions()
  const { toast } = useToast()

  const userAddress = (proxyAddress as `0x${string}`) || zeroAddress

  const { data: erc20Allowance, refetch: refetchERC20Allowance } =
    useReadContract({
      address: collateralContract.address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [userAddress, spenderAddress],
    })

  const { data: balance, refetch: refetchBalance } = useBalance({
    address: userAddress,
    token: collateralContract.address,
  })

  const { data: erc1155IsApproved, refetch: refetchERC1155Approval } =
    useReadContract({
      address: ctfContract.address,
      abi: ctfContract.abi,
      functionName: "isApprovedForAll",
      args: [userAddress, ctfExchangeContract.address],
    })

  const hasERC20Allowance = Boolean(
    erc20Allowance && BigInt(erc20Allowance.toString()) > 0
  )
  const hasERC1155Approval = Boolean(erc1155IsApproved)

  const formattedBalance = balance
    ? Number(balance.value) / Math.pow(10, balance.decimals)
    : 0
  const formattedAllowance =
    balance && erc20Allowance
      ? Number(erc20Allowance) / Math.pow(10, balance.decimals)
      : 0
  const adjustedAllowance = Math.min(formattedBalance, formattedAllowance)

  const approveERC20 = async (): Promise<boolean> => {
    try {
      setIsApproving(true)

      const response = await fetch("/api/approval/approve-collateral-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spenderAddress,
        }),
      })

      if (!response.ok) throw new Error("Failed to fetch approval transaction")
      const { request } = await response.json()

      // Execute the approve transaction through the proxy wallet
      const result = await executeTransaction({
        targetContract: request.targetContract,
        amount: request.amount,
        data: request.data,
      })

      if (!result.success) {
        throw new Error("Failed to approve ERC20 tokens")
      }

      // Refetch the allowance
      await refetchERC20Allowance()

      toast({
        title: "Success",
        description:
          "Tokens Approved: Your tokens have been approved for spending.",
      })

      return true
    } catch (error) {
      console.error("Error approving ERC20 tokens:", error)
      toast({
        title: "Error",
        description: "Failed to approve tokens. Please try again.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsApproving(false)
    }
  }

  const approveERC1155 = async (): Promise<boolean> => {
    try {
      // Check if already approved
      if (erc1155IsApproved) {
        console.log("ERC1155 already approved for operator, skipping approval")
        return true
      }

      setIsApproving(true)

      // Request backend to prepare the approval transaction
      const response = await fetch("/api/approval/approve-conditional-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error("Failed to fetch approval transaction")

      const { request } = await response.json()

      // Execute the setApprovalForAll transaction through the proxy wallet
      const result = await executeTransaction({
        targetContract: request.targetContract,
        amount: request.amount,
        data: request.data,
      })

      if (!result.success) {
        throw new Error("Failed to approve ERC1155 tokens")
      }

      // Refetch the approval status
      await refetchERC1155Approval()

      toast({
        title: "Success",
        description:
          "Conditional Tokens Approved: Your conditional tokens have been approved for operations.",
      })

      return true
    } catch (error) {
      console.error("Error approving ERC1155 tokens:", error)
      toast({
        title: "Error",
        description: "Failed to approve conditional tokens. Please try again.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsApproving(false)
    }
  }

  return {
    isApproving,
    hasERC20Allowance,
    hasERC1155Approval,
    allowance: adjustedAllowance,
    balance: formattedBalance,
    approveERC20,
    approveERC1155,
    refetchBalance,
    refetchAll: async () => {
      await Promise.all([
        refetchERC20Allowance(),
        refetchERC1155Approval(),
        refetchBalance(),
      ])
    },
  }
}
