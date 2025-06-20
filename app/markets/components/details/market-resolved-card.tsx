import { Button } from "@/components/ui/button"
import { ctfContract } from "@/contracts/data/ctf"
import { useConditionalTokenBalance } from "@/hooks/use-conditional-token-balance"
import { useGaslessTransactions } from "@/hooks/use-gasless-client"
import { toast } from "@/hooks/use-toast"
import { syncUserMarketPositions } from "../../utils/positions-sync"
import { MarketInfo } from "@/types/Market"
import axios from "axios"
import { CircleCheck } from "lucide-react"
import { zeroAddress } from "viem"
import { useReadContract } from "wagmi"
import { useUserContext } from "@/providers/user-provider"

interface Team {
  name: string
  logo: string
  shortName: string
}

export default function MarketResolvedCard({
  market,
  homeTeam,
  awayTeam,
  isCrypto = false,
}: {
  market: MarketInfo
  homeTeam?: Team
  awayTeam?: Team
  isCrypto?: boolean
}) {
  const marketResolved = market.status === "resolved"
  const { proxyAddress } = useUserContext()
  const { executeTransaction } = useGaslessTransactions()
  const {
    yesTokenBalance,
    noTokenBalance,
    refetchNoTokenBalance,
    refetchYesTokenBalance,
  } = useConditionalTokenBalance(market.yesTokenId, market.noTokenId)

  const { data: payoutNumerator0 } = useReadContract({
    address: ctfContract.address,
    abi: ctfContract.abi,
    functionName: "payoutNumerators",
    args:
      ctfContract.address && market.conditionId && marketResolved
        ? [market.conditionId as `0x${string}`, BigInt(0)] // Index 0 represents YES outcome
        : [zeroAddress, BigInt(0)],
  })

  const winningOutcome = getWinnerOutcome(payoutNumerator0)
  const side = winningOutcome === 1 ? "YES" : "NO"
  // For crypto markets, we use YES/NO labels instead of team names
  const winner = isCrypto
    ? {
        shortName: winningOutcome === 1 ? "YES" : "NO",
        outcome: winningOutcome,
        refetch:
          winningOutcome === 1 ? refetchYesTokenBalance : refetchNoTokenBalance,
      }
    : getWinnerTeam({
        awayTeam,
        homeTeam,
        outcome: winningOutcome,
        refetchNo: refetchNoTokenBalance,
        refetchYes: refetchYesTokenBalance,
      })

  // Determine if button should be shown
  const showRedeemButton = shouldShowRedeemButton({
    isMarketResolved: marketResolved,
    winningOutcome,
    userYesTokenBalance: yesTokenBalance?.toString() ?? "",
    userNoTokenBalance: noTokenBalance?.toString() ?? "",
  })

  const handleReedemPositions = async () => {
    if (!showRedeemButton) return
    try {
      const response = await axios.post("/api/positions/redeem-positions", {
        conditionId: market.conditionId,
        outcome: winner.outcome === 1 ? 1 : 2,
      })
      const { request } = response.data

      // Execute transaction
      const result = await executeTransaction({
        targetContract: request.targetContract,
        amount: request.amount,
        data: request.data,
      })

      if (!result.success) {
        throw new Error(`Failed to redeem tokens`)
      }

      // Use the shared utility function for syncing positions
      await syncUserMarketPositions({
        userAddress: proxyAddress!,
        marketId: market.id,
        yesTokenId: market.yesTokenId,
        noTokenId: market.noTokenId,
        conditionId: market.conditionId,
        side,
      })

      toast({
        title: "Success",
        description: `Successfully redeemed tokens`,
      })
      winner.refetch()
    } catch (error) {
      console.log({ error })
      toast({
        title: "Error",
        description: `Failed to redeem tokens`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="sm:col-start-2 lg:col-start-3 px-4 sm:px-0">
      <div className="py-8 px-10 w-full rounded-[10px] text-white shadow-md max-w-md h-fit mx-auto lg:sticky lg:top-4 overflow-hidden border border-[#353739]">
        <div className="flex items-center justify-center gap-2 flex-col">
          <CircleCheck size={40} />
          <h3 className="text-2xl whitespace-nowrap">
            Outcome: {winner?.shortName || "Unknown"}
          </h3>
          {showRedeemButton && (
            <Button
              className="mt-4 bg-[#CC0066] hover:bg-[#CC0066]/80 text-white"
              onClick={handleReedemPositions}
            >
              Claim Pending Tokens
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function shouldShowRedeemButton({
  isMarketResolved,
  winningOutcome,
  userYesTokenBalance,
  userNoTokenBalance,
}: {
  isMarketResolved: boolean
  winningOutcome: number | null
  userYesTokenBalance: string | null
  userNoTokenBalance: string | null
}): boolean {
  // Basic requirements
  if (!isMarketResolved || winningOutcome === null) {
    return false
  }

  // Check if user has winning tokens
  const hasWinningTokens =
    winningOutcome === 1
      ? userYesTokenBalance && Number(userYesTokenBalance) > 0
      : userNoTokenBalance && Number(userNoTokenBalance) > 0

  return Boolean(hasWinningTokens)
}

function getWinnerOutcome(payoutNumerator0: unknown): number | null {
  if (payoutNumerator0 === undefined || payoutNumerator0 === null) {
    return null
  }
  const payoutNumber = Number(payoutNumerator0)
  return payoutNumber === 1 ? 1 : 0 // 1 = YES, 0 = NO
}

function getWinnerTeam({
  homeTeam,
  awayTeam,
  outcome,
  refetchNo,
  refetchYes,
}: {
  homeTeam?: Team
  awayTeam?: Team
  outcome: number | null
  refetchYes: () => void
  refetchNo: () => void
}) {
  // Handle case where team data might be missing
  if (!homeTeam || !awayTeam) {
    return {
      shortName: outcome === 1 ? "YES" : "NO",
      outcome,
      refetch: outcome === 1 ? refetchYes : refetchNo,
    }
  }

  if (outcome === 1) {
    return {
      ...homeTeam,
      outcome: outcome,
      refetch: refetchYes,
    }
  } else {
    return {
      ...awayTeam,
      outcome: outcome,
      refetch: refetchNo,
    }
  }
}
