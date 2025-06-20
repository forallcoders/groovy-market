import { useTokensState } from "@/hooks/use-tokens-state"
import { useUserPositions } from "@/hooks/use-user-positions"
import { cn } from "@/lib/utils"
import { useOnboardingMachine } from "@/stores/onboarding"

interface BalanceProps {
  className?: string
}

export default function Balance({ className }: BalanceProps) {
  const { balance } = useTokensState({})
  const { send } = useOnboardingMachine()
  const { totalValue } = useUserPositions()
  const portfolio = totalValue + balance

  return (
    <div className={cn("flex gap-3", className)}>
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-[3px]">
          <h3 className="text-[9px] text-neutral-300 font-semibold leading-[1.2]">
            Portfolio
          </h3>
          <span className="text-xs bg-orchid-700 rounded-sm px-1 py-0.5">
            $ {portfolio.toFixed(2).toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-[3px]">
          <h3 className="text-[9px] text-neutral-300 font-semibold leading-[1.2]">
            Cash
          </h3>
          <span className="text-xs bg-berry-700 rounded-sm px-1 py-0.5">
            $ {balance.toFixed(2).toLocaleString()}
          </span>
        </div>
      </div>
      <button
        onClick={() => send({ type: "START" })}
        className="w-25 bg-[#CC0066] flex gap-2 justify-center items-center rounded-[5px] font-semibold text-[13px] cursor-pointer"
      >
        <span className="">Deposit</span>
      </button>
    </div>
  )
}
