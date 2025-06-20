import { useState } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { collateralContract } from "@/contracts/data/collateral"
import { ctfContract } from "@/contracts/data/ctf"

export function useUSDCApproval() {
  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { writeContractAsync, data: txHash } = useWriteContract()

  const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const approveUSDC = async () => {
    try {
      setIsApproving(true)
      setError(null)

      // Set a large approval amount (here we use the max uint256 value)
      const maxUint256 = BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )

      const hash = await writeContractAsync({
        address: collateralContract.address,
        abi: collateralContract.abi,
        functionName: "approve",
        args: [ctfContract.address, maxUint256],
      })

      return hash
    } catch (err) {
      console.error("Error approving USDC:", err)
      setError(err instanceof Error ? err.message : "Failed to approve USDC")
      return null
    } finally {
      // We don't set isApproving to false here because we want to show loading state
      // while waiting for the transaction to be mined
    }
  }

  // Combination of our manually tracked state and wagmi's loading state
  const isApprovalLoading = isApproving || isWaitingForTx

  return {
    approveUSDC,
    isApproving: isApprovalLoading,
    error,
    txHash,
    resetError: () => setError(null),
  }
}
