import Image from "next/image";

import { Text } from "@/components/ui/Text/text";
import { Game } from "@/types/Sports";

export default function CryptoCard({ gameData }: { gameData: Game }) {
  const { volume, team1, team2 } = gameData;
  team1.prob = 67
  team2.prob = 33

  return (
    <div className='@container md:h-[188px] mt-22 self-center @sm:self-end relative flex flex-col w-full max-w-[560px] gap-4 @sm:gap-8 p-4 pb-5 text-base bg-neutral-750 justify-around rounded-[10px]'>
      {/* Desktop Layout */}
      <div className="hidden @sm:flex flex-row gap-8">
        <div className="flex w-2/3 gap-2 items-center pb-4">
          <Image src="/images/btc.png" alt="" width={65} height={65} className="w-[65px] h-[65px]" />
          <div className="w-full flex justify-between items-center">
            <Text className="text-white text-lg font-medium">BTC Price $1,000,000 by 2026</Text>
          </div>
        </div>
        <div className='flex flex-col gap-2 grow items-center'>
          <div className="flex gap-2 items-center">
            <span className='text-xs font-medium'>{team1.prob}%</span>
            <div className="w-[75px] h-[0.4rem] flex overflow-hidden gap-[2px]">
              <div className="bg-[#00BB5E] rounded-[5px] h-full" style={{ width: team1.prob + "%" }}></div>
              <div className="bg-[#CB4204] rounded-[5px] h-full" style={{ width: team2.prob + "%" }}></div>
            </div>
            <span className='text-xs font-medium'>{team2.prob}%</span>
          </div>
          <p className='text-xs text-[#81898E] leading-none'>{volume}</p>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex @sm:hidden flex-col gap-3">
        <div className="flex justify-between items-center w-full">
          <p className='text-xs text-[#81898E] leading-none'>{volume}</p>
          <div className="flex gap-2 items-center">
            <span className='text-xs font-medium'>{team1.prob}%</span>
            <div className="w-[75px] h-[0.4rem] flex overflow-hidden gap-[2px]">
              <div className="bg-[#00BB5E] rounded-[5px] h-full" style={{ width: team1.prob + "%" }}></div>
              <div className="bg-[#CB4204] rounded-[5px] h-full" style={{ width: team2.prob + "%" }}></div>
            </div>
            <span className='text-xs font-medium'>{team2.prob}%</span>
          </div>
        </div>
        <div className="flex items-center gap-3 py-1">
          <Image src="/images/btc.png" alt="" width={65} height={65} className="w-[45px] h-[45px]" />
          <div className="flex flex-col">
            <Text className="text-white text-base font-medium">BTC Price $1,000,000 by 2026</Text>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <div className="flex flex-1 flex-col items-center">
          <button className="w-full py-2 bg-[#00BB5E]/50 @sm:bg-[#00BB5E]/50 bg-[#1B8348] flex gap-2 justify-center rounded-[5px] font-semibold text-[13px]">
            <span>Buy Yes</span>
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center">
          <button className="w-full py-2 bg-[#CB4204]/50 @sm:bg-[#CB4204]/50 bg-[#8B2E03] flex gap-2 justify-center rounded-[5px] font-semibold text-[13px]">
            <span>Buy No</span>
          </button>
        </div>
      </div>
    </div>
  )
}
