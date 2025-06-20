import Image from "next/image";

import { Text } from "@/components/ui/Text/text";
import { Game } from "@/types/Sports";

export default function GameCard({ gameData }: { gameData: Game }) {
  const { volume, time, team1, team2 } = gameData;
  team1.prob = 33
  team2.prob = 67

  return (
    <div className='@container self-center @sm:self-end md:h-[180px] relative gap-3 flex flex-col w-full max-w-[560px] p-4 pt-3 text-base bg-neutral-750 justify-around rounded-[10px]'>
      {/* Timer */}
      <div className="absolute bg-[#353739] top-[5px] right-[5px] leading-none text-white items-center text-xs font-light p-1.5 rounded-[3px] tracking-[0.5px] hidden @sm:flex">
        {time}
      </div>

      {/* Probability Indicator */}
      <div className='hidden @sm:flex flex-col gap-2 grow items-center'>
        <div className="flex gap-2 items-center">
          <span className='text-xs font-medium'>{team1.prob}%</span>
          <div className="w-[75px] h-[0.4rem] flex overflow-hidden gap-[2px]">
            <div className="bg-[#CC0066] rounded-[5px] h-full" style={{ width: team1.prob + "%" }}></div>
            <div className="bg-[#9900CC] rounded-[5px] h-full" style={{ width: team2.prob + "%" }}></div>
          </div>
          <span className='text-xs font-medium'>{team2.prob}%</span>
        </div>
        <p className='text-xs text-[#81898E] leading-none'>{volume}</p>
      </div>

      {/* Desktop View */}
      <div className="hidden @sm:flex gap-2">
        <div className="flex flex-1 flex-col items-center gap-6">
          <div className="flex flex-col items-center">
            {team1.logo ? (
              <Image width={60} height={60} src={team1.logo} alt="team image" className='w-12.5 h-12.5 rounded-[5px]' />
            ) : (
              <span className='w-12 h-12 rounded-[5px] bg-[#582614]/20' />
            )}
          </div>
          <button className="w-full py-2 bg-[#CC0066]/50 flex gap-2 justify-center rounded-[5px] font-semibold text-[13px]">
            <span>Buy {team1.name}</span>
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className='flex flex-col grow items-center justify-center'>
            <Text className="absolute text-[clamp(0.875rem,3.5vw,1.125rem)] font-medium truncate">{team1.name} vs {team2.name}</Text>
          </div>
          <button className="w-[20vw] max-w-38 py-2 bg-[#415058]/50 flex gap-2 justify-center rounded-[5px] font-semibold text-[13px]">
            <span>Draw</span>
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center gap-6">
          <div className="flex flex-col items-center">
            {team2.logo ? (
              <Image width={60} height={60} src={team2.logo} alt="team image" className='w-12.5 h-12.5 rounded-[5px]' />
            ) : (
              <span className='w-12 h-12 rounded-[5px] bg-[#582614]/20' />
            )}
          </div>
          <button className="w-full py-2 bg-[#9900CC]/50 flex gap-2 justify-center rounded-[5px] font-semibold text-[13px]">
            <span>Buy {team2.name}</span>
          </button>
        </div>
      </div>

      {/* Mobile View */}
      <div className="flex flex-col @sm:hidden gap-2">
        {/* Top Row: Volume and Percentages */}
        <div className="flex justify-between items-center">
          <span className='text-xs text-[#81898E]'>{volume}</span>
          <div className="flex gap-2 items-center">
            <span className='text-xs font-medium'>{team2.prob}%</span>
            <div className="w-[75px] h-[0.4rem] flex overflow-hidden gap-[2px]">
              <div className="bg-[#CC0066] rounded-[5px] h-full" style={{ width: team1.prob + "%" }}></div>
              <div className="bg-[#9900CC] rounded-[5px] h-full" style={{ width: team2.prob + "%" }}></div>
            </div>
            <span className='text-xs font-medium'>{team1.prob}%</span>
          </div>
        </div>

        {/* Content Row: Logos and Title */}
        <div className="flex items-center gap-2">
          <div className="flex py-2">
            <div className="flex flex-col items-center justify-center">
              {team1.logo ? (
                <Image width={60} height={60} src={team1.logo} alt="team image" className='w-10 h-10 @sm:w-12.5 @sm:h-12.5 rounded-[5px] object-cover' />
              ) : (
                <span className='w-8 h-8 @sm:w-12.5 @sm:h-12.5 rounded-[5px] bg-[#582614]/20' />
              )}
            </div>
            <div className="flex flex-col items-center justify-center">
              {team2.logo ? (
                <Image width={60} height={60} src={team2.logo} alt="team image" className='w-10 h-10 @sm:w-12.5 @sm:h-12.5 rounded-[5px] object-cover' />
              ) : (
                <span className='w-8 h-8 @sm:w-12.5 @sm:h-12.5 rounded-[5px] bg-[#582614]/20' />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-0 pb-2">
            <Text className="text-lg font-medium">{team1.name} vs {team2.name}</Text>
            <div className="text-xs text-[#81898E] leading-none">{time}</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col items-center gap-6">
            <button className="w-full py-2 bg-[#CC0066]/50 flex gap-2 justify-center rounded-[5px] font-semibold text-[13px]">
              <span>Buy {team1.name}</span>
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center">
            <button className="w-full py-2 bg-[#415058]/50 flex gap-2 justify-center rounded-[5px] font-semibold text-[13px]">
              <span>Draw</span>
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center gap-6">
            <button className="w-full py-2 bg-[#9900CC]/50 flex gap-2 justify-center rounded-[5px] font-semibold text-[13px]">
              <span>Buy {team2.name}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}