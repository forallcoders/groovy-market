import Image from "next/image";

import { Text } from "@/components/ui/Text/text";
import { Button } from "@/components/ui/Button/Button";
import { ScrollableContainer } from "../../components/scrollable-container";
import { Game } from "@/types/Sports";

export default function ListCard({ gameData }: { gameData: Game }) {
  const { volume, team1, team2 } = gameData;
  team1.prob = 33
  team2.prob = 67

  return (
    <div className='relative @container h-[180px] self-center @sm:self-auto flex flex-col w-full max-w-[560px] gap-1 p-4 pb-0 text-base bg-neutral-750 justify-around rounded-[10px]'>
      <div className="flex gap-8">
        <div className="flex w-2/3 gap-2 items-center pb-4">
          <Image src="/images/btc.png" alt="" width={65} height={65} className="w-[65px] h-[65px]" />
          <div className="w-full flex justify-between items-center">
            <Text className="text-white text-lg font-medium">BTC Price by 2026</Text>
          </div>
        </div>
        <p className='absolute right-4 top-4 text-xs text-[#81898E] leading-none'>{volume}</p>
      </div>

      <ScrollableContainer className="h-[88px] overflow-hidden @sm:overflow-auto">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Text className="text-sm font-semibold">$900,000</Text>
            <div className="flex gap-2 items-center">
              <Text className="text-sm">55%</Text>
              <Button className="h-6 w-12 @sm:h-6 @sm:w-auto bg-[#00BB5E]/50 hover:bg-[#00BB5E]/30 rounded-[5px] font-semibold text-[13px]">
                <span>Yes</span>
              </Button>
              <Button className="h-6 w-12 @sm:h-6 @sm:w-auto bg-[#CB4204]/50 hover:bg-[#CB4204]/30 rounded-[5px] font-semibold text-[13px]">
                <span>No</span>
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <Text className="text-sm font-semibold">$800,000</Text>
            <div className="flex gap-2 items-center">
              <Text className="text-sm">45%</Text>
              <Button className="h-6 w-12 @sm:h-6 @sm:w-auto bg-[#00BB5E]/50 hover:bg-[#00BB5E]/30 rounded-[5px] font-semibold text-[13px]">
                <span>Yes</span>
              </Button>
              <Button className="h-6 w-12 @sm:h-6 @sm:w-auto bg-[#CB4204]/50 hover:bg-[#CB4204]/30 rounded-[5px] font-semibold text-[13px]">
                <span>No</span>
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <Text className="text-sm font-semibold">$700,000</Text>
            <div className="flex gap-2 items-center">
              <Text className="text-sm">35%</Text>
              <Button className="h-6 w-12 @sm:h-6 @sm:w-auto bg-[#00BB5E]/50 hover:bg-[#00BB5E]/30 rounded-[5px] font-semibold text-[13px]">
                <span>Yes</span>
              </Button>
              <Button className="h-6 w-12 @sm:h-6 @sm:w-auto bg-[#CB4204]/50 hover:bg-[#CB4204]/30 rounded-[5px] font-semibold text-[13px]">
                <span>No</span>
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <Text className="text-sm font-semibold">$600,000</Text>
            <div className="flex gap-2 items-center">
              <Text className="text-sm">25%</Text>
              <Button className="h-6 w-12 @sm:h-6 @sm:w-auto bg-[#00BB5E]/50 hover:bg-[#00BB5E]/30 rounded-[5px] font-semibold text-[13px]">
                <span>Yes</span>
              </Button>
              <Button className="h-6 w-12 @sm:h-6 @sm:w-auto bg-[#CB4204]/50 hover:bg-[#CB4204]/30 rounded-[5px] font-semibold text-[13px]">
                <span>No</span>
              </Button>
            </div>
          </div>
        </div>
      </ScrollableContainer>
    </div>
  )
}