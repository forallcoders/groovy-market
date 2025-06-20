import { Button } from "@/components/ui/Button/Button"
import { Slider } from "@/components/ui/slider"
import { Text } from "@/components/ui/Text/text"
import { ctfContract } from "@/contracts/data/ctf"
import { useTokensState } from "@/hooks/use-tokens-state"
import { useUserContext } from "@/providers/user-provider"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { ChangeEvent, useEffect, useState } from "react"

interface LiquidityCardProps {
  initialLiquidity: number
  onLiquidityChange: (value: number) => void
  onPreviewMarket: () => Promise<void>
  isSubmitting: boolean
  probability: number
  setProbability: (value: number) => void
}

export default function LiquidityCard({
  initialLiquidity,
  onLiquidityChange,
  onPreviewMarket,
  isSubmitting,
  probability,
  setProbability,
}: LiquidityCardProps) {
  const [isApproved, setIsApproved] = useState(false)
  const { isConnected } = useUserContext()
  const { setShowAuthFlow } = useDynamicContext()
  const { balance, allowance, approveERC20, isApproving } = useTokensState({
    spenderAddress: ctfContract.address,
  })

  useEffect(() => {
    const checkAllowance = async () => {
      setIsApproved(allowance >= initialLiquidity)
    }

    checkAllowance()
  }, [allowance, initialLiquidity])

  const handleLiquidityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      onLiquidityChange(value)
    }
  }

  const handleApproveUSDC = async () => {
    try {
      setIsApproved(await approveERC20())
    } catch (error) {
      console.error("Failed to approve USDC:", error)
      setIsApproved(false)
    }
  }
  const handleClick = async () => {
    if (!isConnected) {
      setShowAuthFlow(true)
    } else if (!isApproved) {
      await handleApproveUSDC()
    } else {
      await onPreviewMarket()
    }
  }

  const getButtonLabel = () => {
    let buttonLabel = "Log in"
    if (isConnected) {
      if (isApproved) {
        if (isSubmitting) {
          buttonLabel = "Creating..."
        } else {
          buttonLabel = "Create market"
        }
      } else if (isApproving) {
        buttonLabel = "Approving..."
      } else {
        buttonLabel = "Approve USDC"
      }
    }
    return buttonLabel
  }

  const isButtonDisabled = isApproved ? isSubmitting : isApproving

  const buttonLabel = getButtonLabel()

  return (
    <div className="flex justify-center mt-4 mb-10">
      <div className="flex flex-col bg-neutral-800 w-full rounded-lg p-3.5 gap-5">
        <div className="flex flex-col">
          <div className="flex justify-between">
            <div>
              <h1 className="text-lg font-medium">Initial liquidity</h1>
              <Text className="text-neutral-400" variant="tiny" weight="light">
                Balance: ${balance}
              </Text>
            </div>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-2xl">
                $
              </span>
              <input
                type="text"
                value={initialLiquidity}
                onChange={handleLiquidityChange}
                className="w-33 rounded-[10px] px-[10px] pl-8 py-2 border-2 border-[#81898E] text-right text-2xl font-medium focus:outline-none focus:ring-1 focus:ring-[#3A3A3A]"
              />
            </div>
          </div>
          {initialLiquidity > balance && (
            <div className="mt-2 text-amber-400 text-sm text-end">
              Warning: Insufficient balance to provide initial liquidity
            </div>
          )}
        </div>
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-1">
            Market Starting Probability
          </h3>
          <p className="text-sm text-neutral-400 leading-tight mb-4">
            Set the initial market probability distribution. A higher percentage
            reflects a higher expected likelihood for the YES outcome. The NO
            side adjusts accordingly.
          </p>

          <div className="flex justify-between text-xs text-neutral-400 mb-2">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>

          <Slider
            value={[probability]}
            onValueChange={(v) => setProbability(v[0])}
            min={1}
            max={99}
            step={1}
            className="mb-4"
          />

          <div className="text-center space-y-1">
            <p className="text-2xl font-bold text-white">{probability}%</p>
            <p className="text-sm text-neutral-400">
              Implied probability for YES (NO: {100 - probability}%)
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-3">
          <Button
            className="px-14 "
            onClick={handleClick}
            disabled={isButtonDisabled}
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
