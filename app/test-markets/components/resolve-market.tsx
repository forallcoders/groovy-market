import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { oracleResolverContract } from "@/contracts/data/oracle"
import { publicClient } from "@/lib/wallet/public-client"
import { ethers } from "ethers"
import { useState } from "react"
import { useWriteContract } from "wagmi"
import { toast } from "@/hooks/use-toast"
import { MarketInfo } from "@/types/Market"

export default function ResolveMarket({ market }: { market: MarketInfo }) {
  const [activeTab, setActiveTab] = useState<"yes" | "no">("yes")
  const { writeContractAsync } = useWriteContract()

  const handleResolveMarket = async () => {
    try {
      const outcome = activeTab === "yes" ? 1 : 0
      const questionId = ethers.keccak256(ethers.toUtf8Bytes(market.id))

      const txHash = await writeContractAsync({
        address: oracleResolverContract.address,
        abi: oracleResolverContract.abi,
        args: [questionId, outcome],
        functionName: "resolveMarket",
      })

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      })

      if (receipt.status === "reverted") {
        throw new Error("Transaction failed")
      }
      const updateResponse = await fetch(`/api/markets`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "resolved", id: market.id }),
      })

      const updateResult = await updateResponse.json()
      if (!updateResult.success) {
        throw new Error("Failed to update market status to resolved")
      }
      const updatePositionsResponse = await fetch(
        `/api/positions/resolve-market-positions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            marketId: market.id,
            winningTokenId:
              outcome === 1 ? market.yesTokenId : market.noTokenId,
            conditionId: market.conditionId,
          }),
        }
      )

      if (!updatePositionsResponse.ok) {
        console.error("Failed to update user positions")
        toast({
          title: "Warning",
          description:
            "Market resolved successfully, but there was an issue updating user positions",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: `Market successfully resolved with ${activeTab.toUpperCase()} token as the winner`,
        })
      }
    } catch (error) {
      console.log({ error })
    }
  }

  return (
    <Card>
      <CardContent>
        <h3 className="my-4 texl-2xl font-bold">
          Resolve this Market: {market.title}
        </h3>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "yes" | "no")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="yes">YES Token</TabsTrigger>
            <TabsTrigger value="no">NO Token</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={handleResolveMarket} className="mt-4">
          Resolve this market with {activeTab.toUpperCase()} token
        </Button>
      </CardContent>
    </Card>
  )
}
