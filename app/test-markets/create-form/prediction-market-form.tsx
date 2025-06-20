/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useState } from "react"

import { marketCreatorContract } from "@/contracts/data/market-creator"
import { useUSDCApproval } from "@/hooks/use-usdc-approval"
import { ORACLE_RESOLVER } from "@/lib/config"
import { useWriteContract } from "wagmi"
import BalanceAllowanceCard from "../components/balance-allowance-card"
import BasicInfoSection from "./basic-info-section"
import MarketCondition from "./market-condition"
import { SportsPrediction } from "./sports-condition-form"
import { publicClient } from "@/lib/wallet/public-client"
export type FormValues = {
  marketName: string
  description: string
  initialLiquidity: number
}

export interface Condition {
  id: number
  marketType: "crypto" | "sports"
  cryptoCondition?: {
    token: string
    metric: string
    operator: string
    value: number
  }
  sportsCondition?: SportsPrediction
}

const PredictionMarketForm = () => {
  const [marketType, setMarketType] = useState("crypto")
  const [conditions, setConditions] = useState<Condition[]>([
    { id: 1, marketType: "crypto" },
  ])
  const [date, setDate] = useState<Date | null>(null)
  const [time, setTime] = useState({ hour: "12", minute: "00" })
  const [formValues, setFormValues] = useState<FormValues>({
    marketName: "",
    description: "",
    initialLiquidity: 100,
  })
  const { writeContractAsync } = useWriteContract()

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const addCondition = () => {
    const newId =
      conditions.length > 0 ? Math.max(...conditions.map((c) => c.id)) + 1 : 1
    setConditions([...conditions, { id: newId, marketType: "crypto" }])
  }

  const removeCondition = (id: number) => {
    setConditions(conditions.filter((c) => c.id !== id))
  }

  const onConfirm = (id: number, prediction: SportsPrediction | any) => {
    // check if prediction contains sports key
    const isSportsCondition = "sport" in prediction

    setConditions((prev) => {
      const updatedConditions = [...prev]
      const conditionIndex = updatedConditions.findIndex((c) => c.id === id)

      if (conditionIndex !== -1) {
        if (isSportsCondition) {
          updatedConditions[conditionIndex].marketType = "sports"
          updatedConditions[conditionIndex].sportsCondition = prediction
        } else {
          updatedConditions[conditionIndex].marketType = "crypto"
          updatedConditions[conditionIndex].cryptoCondition = prediction
        }
      }
      return updatedConditions
    })
  }

  const handleCreateMarket = async () => {
    if (!date) return
    if (!conditions.length) return
    if (!formValues.marketName) return
    if (!formValues.description) return
    if (!formValues.initialLiquidity) return

    if (
      !conditions.every(
        (condition) =>
          condition.sportsCondition === undefined ||
          condition.cryptoCondition === undefined
      )
    ) {
      return
    }

    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    const hour = parseInt(time.hour)
    const minute = parseInt(time.minute)

    const resolutionDate = new Date(year, month, day, hour, minute)

    const body = {
      title: formValues.marketName,
      description: formValues.description,
      endDate: resolutionDate.toISOString(),
      marketConditions: conditions.map((condition) => {
        return {
          type: condition.marketType,
          data: condition.sportsCondition || condition.cryptoCondition,
        }
      }),
    }

    const response = await fetch("/api/markets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error("Failed to save market to database")
    }
    const marketId = result.data.id

    try {
      const txHash = await writeContractAsync({
        abi: marketCreatorContract.abi,
        address: marketCreatorContract.address,
        functionName: "createMarket",
        args: [marketId, ORACLE_RESOLVER],
      })
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      })
      console.log("Market created on blockchain, transaction:", receipt)

      if (receipt.status === "reverted") {
        throw new Error("Transaction failed")
      }
      // Update market status to 'created' using the API
      const updateResponse = await fetch(`/api/markets`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "created", id: marketId }),
      })

      const updateResult = await updateResponse.json()
      if (!updateResult.success) {
        throw new Error("Failed to update market status to created")
      }
    } catch (error) {
      console.error("Error creating market:", error)
      throw error
    }
  }
  const { approveUSDC, isApproving, error: approvalError } = useUSDCApproval()

  const handleApproveUSDC = async () => {
    try {
      const txHash = await approveUSDC()
      if (txHash) {
        console.log("USDC approved successfully:", txHash)
      }
    } catch (error) {
      console.error("Failed to approve USDC:", error)
    }
  }
  console.log({ approvalError })

  return (
    <div className="max-w-2xl mx-auto p-6 bg-background">
      <BalanceAllowanceCard
        onApprove={handleApproveUSDC}
        isApproving={isApproving}
      />
      <form className="space-y-6">
        {/* Basic Information Section */}
        <BasicInfoSection
          formValues={formValues}
          handleInputChange={handleInputChange}
          date={date}
          setDate={setDate}
          time={time}
          setTime={setTime}
        />

        {/* Market Conditions Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Market Conditions</h3>
            <Button
              onClick={(e) => {
                e.preventDefault()
                addCondition()
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              Add Condition
            </Button>
          </div>
          {conditions.map((condition, index) => (
            <MarketCondition
              key={condition.id}
              condition={condition}
              marketType={marketType}
              setMarketType={setMarketType}
              isLast={index === conditions.length - 1}
              onConfirm={onConfirm}
              removeCondition={removeCondition}
            />
          ))}
        </div>

        <Button
          type="button"
          className="w-full bg-indigo-950 hover:bg-indigo-900 text-white"
          onClick={handleCreateMarket}
        >
          Create Market & Continue
        </Button>
      </form>
    </div>
  )
}

export default PredictionMarketForm
