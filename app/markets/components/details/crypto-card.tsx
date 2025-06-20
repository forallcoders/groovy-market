/* eslint-disable @next/next/no-img-element */

export default function CryptoCard({
  marketInfo,
  bestPrices,
}: {
  marketInfo: any
  bestPrices: { yesBestAsk?: number; noBestAsk?: number }
}) {
  const yesProb = ((bestPrices.yesBestAsk ?? 0.5) * 100).toFixed(0)
  const noProb = ((1 - (bestPrices.yesBestAsk ?? 0.5)) * 100).toFixed(0)
  const creator = marketInfo?.creator

  return (
    <div className="border border-[#353739] rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={marketInfo.image}
            alt={marketInfo.title}
            width={60}
            height={60}
            className="rounded-md"
          />
          <div>
            <h2 className="text-lg font-medium text-white">
              {marketInfo?.title}
            </h2>
            <div className="text-sm text-[#81898E] flex gap-2 items-center">
              <span>{marketInfo.time}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex gap-2 items-center mt-2">
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
          <p className="text-xs text-[#81898E] leading-none">
            {marketInfo.volume}
          </p>
        </div>
      </div>

      {creator && (
        <div className="flex items-center gap-2 text-sm text-[#A0A0A0] mt-1">
          <span className="text-white">Created by</span>
          {creator.avatar ? (
            <img
              src={creator.avatar}
              alt={creator.username}
              width={24}
              height={24}
              className="rounded-full border border-[#3f3f3f]"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#2d2f32]" />
          )}
          <span className="text-[#81898E] font-medium">{creator.username}</span>
        </div>
      )}
    </div>
  )
}
