import { ctfContract } from "@/contracts/data/ctf"
import { useConditionalTokenBalance } from "@/hooks/use-conditional-token-balance"
import { MarketInfo } from "@/types/Market"
import { Info } from "lucide-react"
import { zeroAddress } from "viem"
import { useReadContract } from "wagmi"

interface Team {
  name: string
  logo: string
  shortName: string
}

export default function MarketResolvedHeader({
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
  const { refetchNoTokenBalance, refetchYesTokenBalance } =
    useConditionalTokenBalance(market.yesTokenId, market.noTokenId)

  const { data: payoutNumerator0 } = useReadContract({
    address: ctfContract.address,
    abi: ctfContract.abi,
    functionName: "payoutNumerators",
    args:
      ctfContract.address && market.conditionId
        ? [market.conditionId as `0x${string}`, BigInt(0)] // Index 0 represents YES outcome
        : [zeroAddress, BigInt(0)],
  })

  const winningOutcome = getWinnerOutcome(payoutNumerator0)

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

  return (
    <div className="bg-[#00BB5E] text-white flex items-center p-[10px] gap-2 rounded-[8px]">
      <Info size={20} />
      <h3 className="font-semibold text-lg">
        Market resolved: {winner.shortName}
      </h3>
    </div>
  )
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
