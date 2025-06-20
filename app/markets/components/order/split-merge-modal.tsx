import ResponsiveModal from "@/components/modals/responsive-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ctfContract } from "@/contracts/data/ctf"
import { useConditionalTokenBalance } from "@/hooks/use-conditional-token-balance"
import { useGaslessTransactions } from "@/hooks/use-gasless-client"
import { toast } from "@/hooks/use-toast"
import { useTokensState } from "@/hooks/use-tokens-state"
import { useUserPositions } from "@/hooks/use-user-positions"
import { useUserContext } from "@/providers/user-provider"
import axios from "axios"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { syncUserMarketPositions } from "../../utils/positions-sync"

type SplitMergeAction = "split" | "merge"

interface SplitMergeModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  market: any
  action: SplitMergeAction
}

const SplitMergeModal: React.FC<SplitMergeModalProps> = ({
  open,
  setOpen,
  market,
  action,
}) => {
  const [amount, setAmount] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { proxyAddress } = useUserContext()
  const { executeTransaction } = useGaslessTransactions()
  const {
    balance,
    refetchBalance,
    approveERC1155,
    approveERC20,
    isApproving,
    hasERC1155Approval,
    hasERC20Allowance,
    refetchAll,
  } = useTokensState({
    spenderAddress: ctfContract.address,
  })

  const { refetchPositionsValue } = useUserPositions()
  const {
    yesTokenBalance,
    noTokenBalance,
    refetchYesTokenBalance,
    refetchNoTokenBalance,
  } = useConditionalTokenBalance(market?.yesTokenId, market?.noTokenId)

  useEffect(() => {
    if (open) {
      setAmount("")
      setErrorMessage(null)
      refetchAll()
    }
  }, [open, action])

  // Validate amount when it changes
  useEffect(() => {
    validateAmount(amount)
  }, [
    amount,
    action,
    balance,
    yesTokenBalance,
    noTokenBalance,
    hasERC20Allowance,
  ])

  const isZeroBalance = (() => {
    if (action === "split") return balance === 0
    const yes = Number(yesTokenBalance) / 10 ** 6
    const no = Number(noTokenBalance) / 10 ** 6
    return yes === 0 || no === 0
  })()

  const validateAmount = (value: string) => {
    setErrorMessage(null)

    if (!value) return

    const numValue = parseFloat(value)

    if (isNaN(numValue)) {
      setErrorMessage("Please enter a valid number")
      return
    }

    if (numValue <= 0) {
      setErrorMessage("Amount must be greater than 0")
      return
    }

    if (action === "split") {
      if (numValue > balance) {
        setErrorMessage(`You only have ${balance.toFixed(2)} USDC`)
      }
      return
    }

    // Merge action
    const yes = Number(yesTokenBalance) / 10 ** 6
    const no = Number(noTokenBalance) / 10 ** 6

    if (numValue > yes || numValue > no) {
      setErrorMessage(
        `You need equal amounts of YES and NO tokens. Available: YES ${yes.toFixed(
          2
        )}, NO ${no.toFixed(2)}`
      )
      return
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value

    // Regex to allow numbers with up to 6 decimal places
    const regex = /^(?:\d*)?(?:\.\d{0,6})?$/

    // Only update if the input matches our regex or is empty
    if (regex.test(input) || input === "") {
      setAmount(input)
    }
  }

  const getMaxAmount = () => {
    if (action === "split") {
      return balance
    } else {
      // For merging, we need both YES and NO tokens
      // Get the minimum of both balances since we need equal amounts
      const yesBalance = Number(yesTokenBalance) / 10 ** 6
      const noBalance = Number(noTokenBalance) / 10 ** 6
      return Math.min(yesBalance, noBalance)
    }
  }

  const handleMaxClick = () => {
    const maxAmount = getMaxAmount()
    if (maxAmount > 0) {
      // Format to 6 decimal places maximum
      setAmount(Math.floor(maxAmount * 1000000) / 1000000 + "")
    } else {
      setAmount("0")
      if (action === "merge") {
        setErrorMessage(
          `You need both YES and NO tokens to merge. Current balances: YES: ${
            Number(yesTokenBalance) / 10 ** 6
          }, NO: ${Number(noTokenBalance) / 10 ** 6}`
        )
      } else {
        setErrorMessage(`You don't have any USDC to split`)
      }
    }
  }

  const handleApproveTokens = async () => {
    try {
      setLoading(true)

      // For split operations, approve USDC spending to Conditional Tokens contract
      if (action === "split") {
        const success = await approveERC20()

        if (!success) {
          throw new Error("Failed to approve USDC tokens")
        }

        toast({
          title: "Success",
          description: "USDC tokens approved successfully",
        })
      }

      // For merge operations, approve Conditional Tokens for the exchange
      if (action === "merge") {
        const success = await approveERC1155()

        if (!success) {
          throw new Error("Failed to approve Conditional Tokens")
        }

        toast({
          title: "Success",
          description: "Conditional Tokens approved successfully",
        })
      }
    } catch (error) {
      console.error("Error approving tokens:", error)
      toast({
        title: "Error",
        description: "Failed to approve tokens. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitOperation = async () => {
    try {
      // Prepare endpoint based on action
      const endpoint =
        action === "split"
          ? "/api/positions/split-position"
          : "/api/positions/merge-positions"

      // Call the API
      const response = await axios.post(endpoint, {
        amount: parseFloat(amount),
        marketId: market.id,
        conditionId: market.conditionId,
        yesTokenId: market.yesTokenId,
        noTokenId: market.noTokenId,
      })

      const { request } = response.data

      // Execute transaction
      const result = await executeTransaction({
        targetContract: request.targetContract,
        amount: request.amount,
        data: request.data,
      })

      if (!result.success) {
        throw new Error(`Failed to ${action} tokens`)
      }

      if (action === "split") {
        await axios.post("/api/markets/add-split-volume", {
          marketId: market.id,
          usdcAmount: parseFloat(amount),
          txHash: result?.result?.tx?.hash,
        })
      } else {
        await axios.post("/api/markets/add-merge-volume", {
          marketId: market.id,
          usdcAmount: parseFloat(amount),
          txHash: result?.result?.tx?.hash,
        })
      }

      const bestPrices =
        market.markets?.length > 0
          ? market.markets[0].bestPrices
          : market.bestPrices

      await syncUserMarketPositions({
        userAddress: proxyAddress!,
        marketId: market?.id,
        yesTokenId: market?.yesTokenId,
        noTokenId: market?.noTokenId,
        conditionId: market?.conditionId,
        side: "BOTH",
        tradeType: action === "split" ? "SELL" : "BUY",
        bestPrices,
        amount: {
          yes: action === "split" ? parseFloat(amount) : undefined,
          no: action === "split" ? parseFloat(amount) : undefined,
        },
      })

      // Refresh balances
      refetchBalance()
      refetchYesTokenBalance()
      refetchNoTokenBalance()
      refetchPositionsValue()
      toast({
        title: "Success",
        description: `Successfully ${
          action === "split" ? "split" : "merged"
        } tokens`,
      })

      setOpen(false)
    } catch (error) {
      console.error(`Error during ${action} operation:`, error)

      // Check for API error responses
      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data

        toast({
          title: "Error",
          description: errorData.error || `Failed to ${action} tokens`,
          variant: "destructive",
        })
      } else {
        // Transaction-level errors
        const errorMsg =
          error instanceof Error ? error.message : `Failed to ${action} tokens`
        toast({
          title: "Error",
          description: errorMsg.includes("execution reverted")
            ? "Transaction failed. This could be due to contract restrictions."
            : errorMsg,
          variant: "destructive",
        })
      }
    }
  }

  const handleSubmit = async () => {
    // Validate one more time before submitting
    validateAmount(amount)

    if (errorMessage || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: errorMessage || "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      await handleSubmitOperation()
    } catch (error) {
      // Error is handled in handleSubmitOperation
      console.error(`Error during ${action} operation:`, error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = () => {
    toast({
      title: "No balance",
      description:
        action === "split"
          ? "You have no USDC to split. Please deposit funds."
          : "You need YES and NO tokens to merge. Please acquire or swap them.",
      variant: "destructive",
    })
  }

  const needsApproval =
    (action === "split" && !hasERC20Allowance) ||
    (action === "merge" && !hasERC1155Approval)

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      contentClassName="max-w-md border-none"
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-white">
          {action === "split" ? "Split Tokens" : "Merge Tokens"}
        </h2>

        <div className="mb-4">
          <p className="text-white mb-2">
            {action === "split"
              ? "Split USDC into YES and NO tokens for this market"
              : "Merge YES and NO tokens back into USDC"}
          </p>
        </div>

        {action === "merge" && (
          <div className="mb-4">
            <p className="text-white text-sm mb-2">
              <strong>Note:</strong> To merge tokens, you need equal amounts of
              both YES and NO tokens. Your current balances are:
            </p>
            <div className="flex justify-between bg-white/70 p-2 rounded mb-4">
              <span>
                YES Tokens: {(Number(yesTokenBalance) / 10 ** 6).toFixed(2)}
              </span>
              <span>
                NO Tokens: {(Number(noTokenBalance) / 10 ** 6).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="mb-6">
          <Label htmlFor="amount" className="text-white mb-2 block">
            Amount ({action === "split" ? "USDC" : "Tokens to Merge"})
          </Label>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="text"
              placeholder="Enter amount"
              value={amount}
              onChange={handleAmountChange}
              className={`w-full border-white text-white placeholder:text-white/80 ${
                errorMessage ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
            />
            <Button
              onClick={handleMaxClick}
              className="border-white"
              variant="outline"
            >
              Max
            </Button>
          </div>

          {errorMessage ? (
            <p className="text-xs mt-1 text-red-500">{errorMessage}</p>
          ) : (
            <p className="text-xs mt-1 text-white/70">
              Max available: {getMaxAmount().toFixed(2)}{" "}
              {action === "split" ? "USDC" : "tokens"}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-white"
          >
            Cancel
          </Button>
          {isZeroBalance ? (
            <Button onClick={handleDeposit} className="bg-[#CC0066] text-white">
              Deposit
            </Button>
          ) : needsApproval ? (
            <Button
              onClick={handleApproveTokens}
              disabled={loading}
              className="bg-[#CC0066] text-white"
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : action === "split" ? (
                "Approve USDC"
              ) : (
                "Approve Tokens"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#CC0066] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : action === "split" ? (
                "Split Tokens"
              ) : (
                "Merge Tokens"
              )}
            </Button>
          )}
        </div>
      </div>
    </ResponsiveModal>
  )
}

export default SplitMergeModal
