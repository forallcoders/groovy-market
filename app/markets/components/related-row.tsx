/* eslint-disable @next/next/no-img-element */
import { useMarketContext } from "@/providers/market-provider"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RelatedRow({ market }: { market: any }) {
  const { setSelectedMarketId, setSelectedTokenOption, setSelectedTeam } =
    useMarketContext()
  const router = useRouter()
  const isGrouped = market.grouped === true
  const refLeg = market
  const yesProb = refLeg?.odds?.yes?.prob ?? 0
  const noProb = refLeg?.odds?.no?.prob ?? 0
  const linkId = market.parentMarketId ?? market.id
  const link =
    market.conditionType === "sports"
      ? `/markets/${market.conditionType}/${market.leagueAbbreviation}/${linkId}/details`
      : `/markets/${market.conditionType}/${linkId}/details`

  const handleSelect = (leg: any, option: "yes" | "no", name?: string) => {
    setSelectedMarketId(leg.id)
    if (name) {
      setSelectedTeam({
        logo: leg.image,
        name: name,
        shortName: name,
      })
    } else {
      setSelectedTeam(null)
    }
    setSelectedTokenOption(option === "yes" ? "YES" : "NO")
  }

  const titleElement = (
    <div className="text-white font-semibold text-sm hover:underline">
      {market.title}
    </div>
  )

  const content = (
    <div className="flex justify-between w-full">
      <div className="flex items-center gap-4 max-w-[320px]">
        <img
          src={market.image}
          alt={market.title}
          className={"h-[45px] w-[45px] rounded-[5px]"}
        />
        {titleElement}
      </div>

      {isGrouped && (
        <p className="text-xs text-[#81898E] leading-none mt-1">
          {market.volume} Vol.
        </p>
      )}

      {!isGrouped && market.volume && (
        <div className="flex flex-col items-center">
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-medium">{yesProb}%</span>
            <div className="w-[75px] h-[0.4rem] flex overflow-hidden gap-[2px]">
              <div
                className="bg-[#CC0066] rounded-[5px] h-full"
                style={{ width: yesProb + "%" }}
              />
              <div
                className="bg-[#9900CC] rounded-[5px] h-full"
                style={{ width: noProb + "%" }}
              />
            </div>
            <span className="text-xs font-medium">{noProb}%</span>
          </div>
          <p className="text-xs text-[#81898E] leading-none mt-1">
            {market.volume} Vol.
          </p>
        </div>
      )}
    </div>
  )

  const buttons = isGrouped ? (
    <div className="mt-4 space-y-2 w-full overflow-y-auto max-h-[76px]">
      {market.markets?.map((strike: any, index: number) => {
        const odds = strike.markets?.[0]?.odds ?? {}
        const yesProb = odds?.yes?.prob ?? 0
        return (
          <div
            key={`${strike.variantKey}-${index}`}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-sm font-medium">{strike.title}</span>
            <span className="text-sm ml-auto mr-2 leading-none mt-1">
              {yesProb}%
            </span>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 cursor-pointer bg-[#157245] rounded-[3px]"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(strike, "yes", strike.title)
                }}
              >
                YES {strike.odds?.yes?.value}
              </button>
              <button
                className="px-2 py-1 cursor-pointer bg-[#62321E] rounded-[3px]"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(strike, "no", strike.title)
                }}
              >
                NO {strike.odds?.no?.value}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  ) : (
    <div className={"flex gap-4 w-fit"}>
      <Link
        href={link}
        className="cursor-pointer py-2 bg-[#157245] rounded-[5px] font-semibold text-[11px] w-[80px] text-center flex items-center justify-center"
      >
        YES&nbsp;{refLeg?.odds?.yes?.value}
      </Link>
      <Link
        href={link}
        className="cursor-pointer py-2 bg-[#62321E] rounded-[5px] font-semibold text-[11px] w-[80px] text-center flex items-center justify-center"
      >
        NO&nbsp;{refLeg?.odds?.no?.value}
      </Link>
    </div>
  )

  return (
    <div
      onClick={() => router.push(link)}
      className="border border-[#353739] rounded-lg p-2 cursor-pointer flex gap-4 justify-between items-center"
    >
      <div className="flex flex-col w-full">{content}</div>
      <div>{buttons}</div>
    </div>
  )
}
