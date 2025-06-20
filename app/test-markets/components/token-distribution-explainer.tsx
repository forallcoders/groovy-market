import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

interface TokenDistributionExplainerProps {
  initialLiquidity: string
}

export default function TokenDistributionExplainer({
  initialLiquidity,
}: TokenDistributionExplainerProps) {
  const tokenAmount = parseFloat(initialLiquidity || "0").toLocaleString()

  return (
    <Alert className="mb-6 bg-blue-50 text-blue-700 border-blue-200">
      <AlertTitle className="flex items-center gap-2">
        <Info size={16} />
        Token Distribution Explanation
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          When you create a market with <strong>{tokenAmount} USDC</strong>{" "}
          initial liquidity:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Youll receive <strong>{tokenAmount} YES tokens</strong> and{" "}
            <strong>{tokenAmount} NO tokens</strong>
          </li>
          <li>
            All tokens will be placed in the order book to maximize liquidity
          </li>
          <li>
            Tokens are distributed across BID and ASK orders for both YES and NO
            tokens
          </li>
          <li>
            The distribution is weighted based on your probability setting:
            higher probability means more YES tokens available
          </li>
        </ul>
        <p className="text-sm italic mt-1">
          This maximizes market liquidity and ensures your market has active
          orders on both sides.
        </p>
      </AlertDescription>
    </Alert>
  )
}
