"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Textarea } from "@/components/ui/textarea"
import { marketCreatorContract } from "@/contracts/data/market-creator"
import { useOrderCreation } from "@/hooks/use-order-creation"
import { useUSDCApproval } from "@/hooks/use-usdc-approval"
import { ORACLE_RESOLVER } from "@/lib/config"
import { Match } from "@/types/Matches"
import { Plus, X } from "lucide-react"
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi"
import BalanceAllowanceCard from "./balance-allowance-card"
import SportCondition from "./sport-condition"

const marketFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name must be at least 1 character",
  }),
  description: z.string().min(1, {
    message: "Description must be at least 1 character",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  endTimeHour: z.string().regex(/^([0-1]?[0-9]|2[0-3])$/, {
    message: "Hour must be between 0-23",
  }),
  endTimeMinute: z.string().regex(/^[0-5]?[0-9]$/, {
    message: "Minute must be between 0-59",
  }),

  initialLiquidity: z.string().refine(
    (val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num >= 100
    },
    { message: "Initial liquidity must be at least 100 USDC" }
  ),
})

const formSchema = z.object({
  marketDetails: marketFormSchema,
})

type FormValues = z.infer<typeof formSchema>

type MarketCondition = {
  type: string
  data: unknown
}

export default function CreateMarketForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])

  const { approveUSDC, isApproving, error: approvalError } = useUSDCApproval()
  const [conditionType, setConditionType] = useState<string>("Sports")
  const { writeContractAsync, data: hash } = useWriteContract()
  const [marketConditions, setMarketConditions] = useState<MarketCondition[]>([
    {
      type: "sports",
      data: null,
    },
  ])

  const { data } = useWaitForTransactionReceipt({ hash })
  console.log({ data })
  console.log({ marketConditions })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      marketDetails: {
        name: "",
        description: "",
        endTimeHour: "12",
        endTimeMinute: "00",
        initialLiquidity: "100",
      },
    },
  })

  const { error: orderError } = useOrderCreation()

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)

      const year = values.marketDetails.endDate.getFullYear()
      const month = values.marketDetails.endDate.getMonth()
      const day = values.marketDetails.endDate.getDate()
      const hour = parseInt(values.marketDetails.endTimeHour)
      const minute = parseInt(values.marketDetails.endTimeMinute)

      const resolutionDate = new Date(year, month, day, hour, minute)

      const body = {
        title: values.marketDetails.name,
        description: values.marketDetails.description,
        endDate: resolutionDate.toISOString(),
        // marketConditions: values.marketDetails.marketConditions.map(
        //   (condition) => {
        //     return {
        //       type: condition.type,
        //       data: condition.data,
        //     };
        //   }
        // ),
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
      // setMarketId(marketId)

      try {
        const baseInitialLiquidity = BigInt(
          parseFloat(values.marketDetails.initialLiquidity) * 10 ** 6
        )
        console.log({ baseInitialLiquidity, marketId, ORACLE_RESOLVER })
        const receipt = await writeContractAsync({
          abi: marketCreatorContract.abi,
          address: marketCreatorContract.address,
          functionName: "createMarket",
          args: [marketId, ORACLE_RESOLVER],
          // gas: BigInt(30000000),
          // maxFeePerGas: parseGwei("1"),
          // maxPriorityFeePerGas: parseGwei("1"),
        })

        console.log("Market created on blockchain, transaction:", receipt)

        // const marketResponse = await fetch(`/api/markets/${marketId}/info`)
      } catch (blockchainError) {
        console.error("Blockchain error:", blockchainError)
        throw blockchainError
      } finally {
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Error in submission:", error)
      setIsSubmitting(false)
    }
  }

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

  useEffect(() => {
    const fetchMatches = async () => {
      const response = await fetch(`/api/matches`)
      const data = await response.json()
      console.log({ data })
      setMatches(data)
    }
    fetchMatches()
  }, [])
  console.log({ matches })
  return (
    <>
      <Card className="w-full max-w-3xl p-6 mt-10">
        <CardHeader className="pb-3">
          <CardTitle>Create New Market</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <BalanceAllowanceCard
                onApprove={handleApproveUSDC}
                isApproving={isApproving}
              />
              {approvalError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Error approving USDC</AlertTitle>
                  <AlertDescription>{approvalError}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="marketDetails.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Market name</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marketDetails.description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription>Market description</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marketDetails.initialLiquidity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Liquidity (USDC)</FormLabel>
                    <FormControl>
                      <Input type="number" min="100" {...field} />
                    </FormControl>
                    <FormDescription>
                      Amount of USDC to use for initial market liquidity
                      (minimum 100 USDC)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Market Conditions</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMarketConditions((prev) => [
                        ...prev,
                        { type: "sports", data: null },
                      ])
                    }}
                    className="bg-slate-700 border-slate-600 text-slate-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </div>

                <div className="space-y-4">
                  {marketConditions.map((field, index) => (
                    <div
                      key={index}
                      className="border border-slate-700 rounded-md p-4"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-medium">
                          Condition {index + 1}
                        </h4>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setMarketConditions(
                                marketConditions.filter((_, i) => i !== index)
                              )
                            }
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col gap-4">
                        <Select
                          value={conditionType}
                          onValueChange={(value) => setConditionType(value)}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Crypto">Crypto</SelectItem>
                            <SelectItem value="Sports">Sports</SelectItem>
                            <SelectItem value="Traditional">
                              Traditional Markets
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <SportCondition
                          matches={matches}
                          onAddCondition={(condition: unknown) => {
                            setMarketConditions((prev) => {
                              prev[index] = {
                                type: "sports",
                                data: condition,
                              }
                              return [...prev]
                            })
                          }}
                          condition={marketConditions[index]}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* {form.formState.errors.marketDetails?.marketConditions && (
                  <p className="text-sm font-medium text-red-500 dark:text-red-400">
                    {
                      form.formState.errors.marketDetails.marketConditions
                        .message
                    }np
                  </p>
                )} */}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? "Creating Market..."
                  : "Create Market & Continue"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Display any errors or information from order creation */}
      {orderError && (
        <div className="mt-4">
          <Alert variant="destructive">
            <AlertTitle>Error creating orders</AlertTitle>
            <AlertDescription>{orderError}</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  )
}
