import { useState, useEffect } from "react"
import { useAccount, useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { collateralContract } from "@/contracts/data/collateral"
import { ctfContract } from "@/contracts/data/ctf"

export default function BalanceAllowanceCard({
  onApprove,
  isApproving = false,
}: {
  onApprove: () => void
  isApproving: boolean
}) {
  const { address, isConnected } = useAccount()
  const [isInsufficientBalance, setIsInsufficientBalance] = useState(false)
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    address: collateralContract.address,
    abi: collateralContract.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  })
  const { data: allowance, isLoading: isLoadingAllowance } = useReadContract({
    address: collateralContract.address,
    abi: collateralContract.abi,
    functionName: "allowance",
    args: address && isConnected ? [address, ctfContract.address] : undefined,
  })

  useEffect(() => {
    if (balance) {
      setIsInsufficientBalance(
        parseFloat(formatUnits(balance as bigint, 6)) < 100
      )
    }
  }, [balance])

  const formattedBalance = balance
    ? parseFloat(formatUnits(balance as bigint, 6))
    : "0.00"
  const formattedAllowance = allowance
    ? parseFloat(formatUnits(allowance as bigint, 6))
    : "0.00"

  if (isLoadingBalance || isLoadingAllowance) {
    return (
      <Card className="bg-slate-800 border-slate-700 text-slate-200 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Checking USDC Balance...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700 text-slate-200 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Your USDC Funds</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-slate-400">Balance:</div>
          <div className="font-medium">
            {formattedBalance.toLocaleString()} USDC
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-slate-400">CTF Allowance:</div>
          <div className="font-medium">
            {formattedAllowance.toLocaleString()} USDC
          </div>
        </div>

        {isInsufficientBalance && (
          <Alert className="mb-3 bg-red-900/30 border-red-800 text-red-200">
            <AlertDescription>
              You need at least 100 USDC to create a market.
            </AlertDescription>
          </Alert>
        )}

        {parseFloat(formattedAllowance.toString()) < 100 && (
          <Button
            onClick={onApprove}
            disabled={
              isApproving || parseFloat(formattedBalance.toString()) < 100
            }
            className="w-full"
            variant={
              parseFloat(formattedBalance.toString()) < 100
                ? "outline"
                : "default"
            }
          >
            {isApproving ? "Approving..." : "Approve USDC for Market Creation"}
          </Button>
        )}

        <div className="text-xs text-slate-400 mt-2">
          Note: The initial liquidity you set will be transferred from your
          wallet when creating the market.
        </div>
      </CardContent>
    </Card>
  )
}
