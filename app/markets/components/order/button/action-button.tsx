import { Button } from "@/components/ui/button"
import { useUserContext } from "@/providers/user-provider"
import { useOnboardingMachine } from "@/stores/onboarding"
import {
  MarketPanelVariant,
  OrderType,
  TokenLabels,
  TokenOption,
  TradeType,
} from "@/types/Market"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"

interface ActionButtonProps {
  hasAllowance: boolean
  balance: number
  amount: number
  orderType: OrderType
  tradeType: TradeType
  selectedOption: TokenOption
  limitPrice: string
  sharesAmount: string
  loading: boolean
  error: string | null
  calculateTotalCost: (shares: number, limitPrice: number) => number
  handleApprove: () => Promise<void>
  handleTrade: () => Promise<void>
  variant?: MarketPanelVariant
  tokenLabels?: TokenLabels
}

export function ActionButton({
  hasAllowance,
  balance,
  amount,
  orderType,
  tradeType,
  selectedOption,
  limitPrice,
  sharesAmount,
  loading,
  error,
  calculateTotalCost,
  handleApprove,
  handleTrade,
  variant = "default",
  tokenLabels,
}: ActionButtonProps) {
  const { user, proxyAddress } = useUserContext()
  const { setShowAuthFlow } = useDynamicContext()
  const { send } = useOnboardingMachine()
  const costAmount =
    orderType === "market"
      ? amount
      : calculateTotalCost(Number(sharesAmount), Number(limitPrice))

  const handleClick = () => {
    if (!user) {
      setShowAuthFlow(true)
    } else if (
      (balance < costAmount && orderType === "market" && tradeType === "BUY") ||
      !proxyAddress
    ) {
      send({ type: "START" })
    } else if (hasAllowance) {
      handleTrade()
    } else {
      handleApprove()
    }
  }
  const isDisabled =
    ((orderType === "market" && amount === 0) ||
      (orderType === "limit" && (!limitPrice || !sharesAmount)) ||
      loading ||
      error !== null) &&
    hasAllowance

  const getTokenLabel = () => {
    if (variant === "teamAbbreviations" && tokenLabels) {
      return selectedOption === "YES" ? tokenLabels.YES : tokenLabels.NO
    }
    return selectedOption.toLowerCase()
  }

  const getButtonLabel = () => {
    if (!user) return "Sign In"
    if (!proxyAddress) return "Enable Trading"
    if (balance < costAmount && orderType === "market" && tradeType === "BUY") {
      return "Deposit"
    }
    if (hasAllowance) {
      if (loading) return "Processing..."
      if (tradeType === "BUY") {
        return `Buy ${getTokenLabel()} ${
          orderType === "limit" ? "(LIMIT)" : ""
        }`
      } else {
        return `Sell ${getTokenLabel()} ${
          orderType === "limit" ? "(LIMIT)" : ""
        }`
      }
    }
    return "Approve Balance"
  }

  const buttonLabel = getButtonLabel()
  return (
    <Button
      className="w-full py-[10px] bg-[#00CC66] hover:bg-[#00CC66] rounded-[5px] capitalize font-bold text-[13px]"
      onClick={handleClick}
      disabled={isDisabled}
    >
      {buttonLabel}
    </Button>
  )
}
