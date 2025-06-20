import { MarketPosition } from "@/hooks/market/use-market-positions"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MarketInfo } from "@/types/Market"
import { useReadContract } from "wagmi"
import { ctfContract } from "@/contracts/data/ctf"
import { zeroAddress } from "viem"
import { useGaslessTransactions } from "@/hooks/use-gasless-client"
import { toast } from "@/hooks/use-toast"
import { useUserContext } from "@/providers/user-provider"
import { syncUserMarketPositions } from "../../utils/positions-sync"

interface UserMarketPositionsProps {
  positions: MarketPosition[]
  market: MarketInfo
  yesTokenLabel?: string
  noTokenLabel?: string
  isCrypto?: boolean
  hasOrders?: boolean
  isTabView?: boolean
}

export default function UserMarketPositions({
  positions,
  market,
  yesTokenLabel = "YES",
  noTokenLabel = "NO",
  isCrypto = false,
  hasOrders = false,
  isTabView = false,
}: UserMarketPositionsProps) {
  const marketResolved = market.status === "created"

  const { data: payoutNumerator0 } = useReadContract({
    address: ctfContract.address,
    abi: ctfContract.abi,
    functionName: "payoutNumerators",
    args:
      ctfContract.address && market.conditionId && marketResolved
        ? [market.conditionId as `0x${string}`, BigInt(0)] // YES = idx 0
        : [zeroAddress, BigInt(0)],
  })

  const winningOutcome: 0 | 1 | null = !payoutNumerator0
    ? null
    : Number(payoutNumerator0) === 1
    ? 1
    : 0

  const { executeTransaction } = useGaslessTransactions()
  const { proxyAddress } = useUserContext()

  if (positions.length === 0) return null

  const handleRedeem = async () => {
    try {
      const { request } = await (
        await fetch("/api/positions/redeem-positions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conditionId: market.conditionId,
            outcome: winningOutcome === 1 ? 1 : 2,
          }),
        })
      ).json()

      const res = await executeTransaction({
        targetContract: request.targetContract,
        amount: request.amount,
        data: request.data,
      })
      if (!res.success) throw new Error("Failed on‑chain")

      await syncUserMarketPositions({
        userAddress: proxyAddress!,
        marketId: market.id,
        yesTokenId: market.yesTokenId,
        noTokenId: market.noTokenId,
        conditionId: market.conditionId,
        side: winningOutcome === 1 ? "YES" : "NO",
      })

      toast({ title: "Success", description: "Tokens claimed ✨" })
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Could not claim tokens",
        variant: "destructive",
      })
    }
  }

  return (
    <div
      className={cn(
        "rounded-t-[10px] border-[1.5px] border-[#353739] backdrop-blur-sm",
        { "rounded-b-[10px]": !hasOrders, "p-4": !isTabView, "p-2": isTabView }
      )}
    >
      {!isTabView && (
        <h2 className="text-xl font-semibold mb-4">Your Positions</h2>
      )}
      <div className="max-h-[260px] overflow-y-auto">
        <Table className="table-fixed w-full">
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="border-white hover:bg-transparent">
              <TableHead className="text-white font-bold">Position</TableHead>
              <TableHead className="text-white font-bold">Stake</TableHead>
              <TableHead className="text-white font-bold">Current</TableHead>
              <TableHead className="text-right text-white font-bold">
                To get
              </TableHead>
              <TableHead className="text-right text-white font-bold"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {positions.map((pos) => {
              /* ---------------- row‑level gate for claim button -------------- */
              const showButton = shouldShowRedeemButton({
                isMarketResolved: marketResolved,
                winningOutcome,
                userYesTokenBalance: pos.isYesToken
                  ? pos.balance.toString()
                  : null,
                userNoTokenBalance: !pos.isYesToken
                  ? pos.balance.toString()
                  : null,
              })

              return (
                <TableRow
                  key={pos.tokenId}
                  className="border-white hover:bg-muted/20"
                >
                  <TableCell className="font-medium">
                    <span className="flex flex-col">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-md text-white text-xs font-medium w-fit",
                          isCrypto
                            ? pos.isYesToken
                              ? "bg-[#157245]"
                              : "bg-[#62321E]"
                            : pos.isYesToken
                            ? "bg-[#CC0066]"
                            : "bg-[#9900CC]"
                        )}
                      >
                        {pos.isYesToken ? yesTokenLabel : noTokenLabel}
                      </span>

                      <span className="text-xs">
                        {pos.entryPrice
                          ? `${(pos.entryPrice * 100).toFixed(0)}¢`
                          : "-"}
                      </span>
                      <span className="text-xs text-[#81898E]">
                        {pos.balance.toFixed(0)} shares
                      </span>
                    </span>
                  </TableCell>

                  <TableCell>
                    {pos.entryPrice ? `$${pos.entryPrice.toFixed(2)}` : "-"}
                  </TableCell>

                  <TableCell>${pos.value.toFixed(2)}</TableCell>

                  <TableCell className="text-right">
                    ${(pos.balance * 1).toFixed(2)}
                  </TableCell>

                  <TableCell className="text-right">
                    {showButton && (
                      <Button
                        size="sm"
                        className="bg-[#CC0066] hover:bg-[#CC0066]/80 text-white"
                        onClick={handleRedeem}
                      >
                        Claim
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function shouldShowRedeemButton({
  isMarketResolved,
  winningOutcome = 1,
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
