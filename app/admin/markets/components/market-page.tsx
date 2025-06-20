"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { oracleResolverContract } from "@/contracts/data/oracle"
import { useToast } from "@/hooks/use-toast"
import { MarketConditionType } from "@/lib/db/schema"
import { publicClient } from "@/lib/wallet/public-client"
import { MarketInfo } from "@/types/Market"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { ethers } from "ethers"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useWriteContract } from "wagmi"

interface ResultDetails {
  home_score?: number
  away_score?: number
  winner?: string
  total_goals?: number
  total_points?: number
  first_fighter?: string
  second_fighter?: string
  first_fighter_won?: boolean
  win_method?: string
  round?: number
  driver_name?: string
  team_name?: string
  [key: string]: any
}

interface PossibleMarket {
  type: string
  outcome: string
}

interface OutcomeData {
  sport_type: string
  result_details: ResultDetails
  possible_markets?: PossibleMarket[]
}

interface MarketConditionData {
  outcome?: OutcomeData
  finalStatus?: string
  closedAt?: string
  [key: string]: any
}

interface MarketCondition {
  id: string
  marketId: string
  apiId?: string
  predictionDate?: Date
  variantKey?: string
  type: MarketConditionType
  asset: string
  metric: string
  metricCondition: string
  leagueAbbreviation?: string
  data: MarketConditionData
  createdAt: Date
  updatedAt: Date
}

interface MarketOutcomeResult {
  label: string
  yesWins: boolean | null
}

// API response types
interface MarketsResponse {
  markets: MarketInfo[]
  marketConditions: MarketCondition[]
}

export default function AdminMarketsPage({
  type,
}: {
  type: MarketConditionType;
}) {
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [marketConditions, setMarketConditions] = useState<
    Record<string, MarketCondition>
  >({})
  const [loading, setLoading] = useState<boolean>(true)
  const [resolving, setResolving] = useState<boolean>(false)
  const [selectedMarket, setSelectedMarket] = useState<MarketInfo | null>(null)
  const { primaryWallet } = useDynamicContext()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterStatus = searchParams.get("status") || "closed"
  const { writeContractAsync } = useWriteContract()

  // Fetch markets data
  useEffect(() => {
    async function fetchMarkets() {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/admin/markets?status=${filterStatus}&type=${type}`
        )
        if (!response.ok) throw new Error("Failed to fetch markets")
        const data: MarketsResponse = await response.json()
        setMarkets(data.markets)

        // Create a map of market conditions
        const conditionsMap: Record<string, MarketCondition> = {}
        data.marketConditions.forEach((condition) => {
          if (!conditionsMap[condition.marketId]) {
            conditionsMap[condition.marketId] = condition
          }
        })

        setMarketConditions(conditionsMap)
      } catch (error) {
        console.error("Error fetching markets:", error)
        toast({
          title: "Error",
          description: "Failed to load markets",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMarkets()
  }, [filterStatus, toast, type])

  const handleTabChange = (value: string) => {
    router.push(`/admin/markets/${type}?status=${value}`)
  }

  // Function to resolve a market on the blockchain
  async function resolveMarket(
    marketId: string,
    yesWins: boolean
  ): Promise<void> {
    if (!primaryWallet?.address) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive",
      })
      return
    }

    try {
      setResolving(true)

      // Get the market to resolve
      const market = markets.find((m) => m.id === marketId)
      if (!market) {
        throw new Error("Market not found")
      }

      // Calculate questionId from market ID using keccak256
      const questionId = ethers.keccak256(ethers.toUtf8Bytes(marketId))

      // Determine outcome value (1 for YES, 0 for NO)
      const outcome = yesWins ? 1 : 0

      // Call the contract function
      const txHash = await writeContractAsync({
        address: oracleResolverContract.address,
        abi: oracleResolverContract.abi,
        args: [questionId, outcome],
        functionName: "resolveMarket",
      })
      console.log("Transaction hash:", txHash)
      toast({
        title: "Transaction Submitted",
        description: `Transaction hash: ${txHash}`,
      })

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      })

      if (receipt.status === "reverted") {
        throw new Error("Transaction failed")
      }

      // Update the market status in your database
      const updateResponse = await fetch(`/api/markets`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "resolved", id: marketId }),
      })

      const updateResult = await updateResponse.json()
      if (!updateResult.success) {
        throw new Error("Failed to update market status to resolved")
      }

      // Refresh the markets list
      const response = await fetch(`/api/admin/markets?status=${filterStatus}`)
      const data: MarketsResponse = await response.json()
      setMarkets(data.markets)

      // Reset selected market
      setSelectedMarket(null)
    } catch (error: any) {
      console.error("Error resolving market:", error)
      toast({
        title: "Error",
        description: `Failed to resolve market: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setResolving(false)
    }
  }

  // Format date for display
  const formatDate = (dateString?: Date | string): string => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  // Determine market outcome based on outcome data
  const determineMarketOutcome = (
    type: MarketConditionType,
    condition?: MarketCondition,
  ): string | null => {

    if (!condition?.data?.outcome && typeof condition?.data?.resolution !== "boolean") return null
    const outcomeData = type === "sports" ? condition.data.outcome : condition.data.resolution

    if (type === "crypto" && typeof outcomeData === "boolean"){
      return outcomeData ? "Yes" : "No"
    }

    // For different market types, determine the outcome
    if (condition.type === "sports" && typeof outcomeData === "object") {
      const metric = condition.metric.toLowerCase()

      if (metric.includes("winner") || metric.includes("moneyline")) {
        return outcomeData.result_details.winner || null
      }

      // Look for specific market types in possible_markets array
      if (outcomeData.possible_markets) {
        for (const market of outcomeData.possible_markets) {
          if (metric.includes(market.type)) {
            return market.outcome
          }
        }
      }
      return outcomeData.result_details.winner || "Unknown"
    }
    return null
  }


  const outcomeToYesNo = (
    condition?: MarketCondition,
    outcome?: string | null,
  ): MarketOutcomeResult => {
    if (!outcome) return { label: "Unknown", yesWins: null }
    outcome = outcome.toLowerCase()
    let yesWins: boolean | null = null

    // Simple cases
    if (outcome === "yes") yesWins = true
    if (outcome === "no") yesWins = false

    // For sports markets
    if (condition?.type === "sports") {
      const metric = condition.metric.toLowerCase()

      if (metric.includes("winner") || metric.includes("moneyline")) {
        yesWins = outcome === condition?.data?.value
      } else if (metric.includes("over/under")) {
        yesWins = outcome === "over"
      }
    }

    return {
      label:
        yesWins === true
          ? "YES"
          : yesWins === false
          ? "NO"
          : outcome.toUpperCase(),
      yesWins,
    }
  }

  return (
    <div className="container mx-auto py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">Market Resolution Dashboard</h1>

      <Tabs defaultValue={filterStatus} onValueChange={handleTabChange}>
        <TabsList className="mb-8 bg-transparent">
          <TabsTrigger value="closed" className="text-white bg-transparent">
            Closed Markets
            <Badge className="ml-2 bg-amber-500" variant="secondary">
              {filterStatus === "closed" && !loading ? markets.length : "..."}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="text-white bg-transparent">
            Resolved Markets
            <Badge className="ml-2 bg-green-500" variant="secondary">
              {filterStatus === "resolved" && !loading ? markets.length : "..."}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="closed">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : markets.length === 0 ? (
            <div className="text-center py-12 border border-gray-50 rounded-lg">
              <h3 className="text-xl font-medium">No closed markets found</h3>
              <p className="text-muted-foreground mt-2">
                Markets will appear here when they are closed by the system
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto rounded-md border">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Market</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Closed On</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {markets.map((market) => {
                      const condition = marketConditions[market.id]
                      const outcome = determineMarketOutcome(type, condition)
                      const { label, yesWins } = outcomeToYesNo(
                        condition,
                        outcome
                      )

                      if (yesWins === null) {
                        return null
                      }
                      return (
                        <TableRow key={market.id} className="">
                          <TableCell className="font-medium">
                            {market.title}
                            <span>
                              {condition?.variantKey === "draw"
                                ? ` ${condition?.data?.home_team_name} vs ${condition?.data?.away_team_name}`
                                : ""}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-white">
                              {condition?.type || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(market.updatedAt)}</TableCell>
                          <TableCell>
                            {outcome ? (
                              <Badge
                                className={`uppercase
                                ${
                                  outcome.toLowerCase() === "home"
                                    ? "bg-blue-500"
                                    : ""
                                }
                                ${
                                  outcome.toLowerCase() === "away"
                                    ? "bg-purple-500"
                                    : ""
                                }
                                ${
                                  outcome.toLowerCase() === "draw"
                                    ? "bg-gray-500"
                                    : ""
                                }
                                ${
                                  outcome.toLowerCase() === "over"
                                    ? "bg-green-500"
                                    : ""
                                }
                                ${
                                  outcome.toLowerCase() === "under"
                                    ? "bg-red-500"
                                    : ""
                                }
                              `}
                              >
                                {outcome}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">Unknown</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedMarket(market)}
                                  disabled={yesWins === null || resolving}
                                  variant={"secondary"}
                                >
                                  Resolve as {label}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Confirm Market Resolution
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {`Are you sure you want to resolve market "${market.title}" as ${label}?`}
                                    <br />
                                    This will execute a blockchain transaction
                                    and cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      yesWins !== null &&
                                      resolveMarket(market.id, yesWins)
                                    }
                                    disabled={resolving || yesWins === null}
                                  >
                                    {resolving
                                      ? "Processing..."
                                      : "Confirm Resolution"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : markets.length === 0 ? (
            <div className="text-center py-12 border border-gray-50 rounded-lg">
              <h3 className="text-xl font-medium">No resolved markets found</h3>
              <p className="text-muted-foreground mt-2">
                Resolved markets will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Market</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Resolved On</TableHead>
                    <TableHead>Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {markets.map((market) => {
                    const condition = marketConditions[market.id]
                    const outcome = determineMarketOutcome(type, condition)
                    const { label, yesWins } = outcomeToYesNo(
                      condition,
                      outcome
                    )
                    if (yesWins === null) {
                      return null
                    }
                    return (
                      <TableRow key={market.id} className="">
                        <TableCell className="font-medium">
                          {market.title}
                          <span>
                            {condition?.variantKey === "draw"
                              ? ` ${condition?.data?.home_team_name} vs ${condition?.data?.away_team_name}`
                              : ""}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-white">
                            {condition?.type || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(market.updatedAt)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`
                            ${label === "YES" ? "bg-green-500 text-white" : ""}
                            ${label === "NO" ? "bg-red-500 text-white" : ""}
                          `}
                          >
                            {label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
