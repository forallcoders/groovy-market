"use client"

import { useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function GameSlider() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["groupedSportsMarkets"],
    queryFn: async () => {
      const res = await fetch("/api/markets/list/sports-by-date")
      if (!res.ok) throw new Error("Failed to fetch markets")
      const data = await res.json()
      return data.groups
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  return (
    <div className="flex w-full overflow-x-auto px-4 py-2 gap-4 scrollbar-thin scrollbar-thumb-gray-500/30">
      <div className="flex flex-row gap-4 min-w-max">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <DayColumnSkeleton key={i} />
            ))
          : error
          ? null
          : data?.map((group: any) => (
              <DayColumn key={group.date} group={group} />
            ))}
      </div>
    </div>
  )
}

function DayColumn({ group }: { group: any }) {
  const date = parseISO(group.date)
  const day = format(date, "EEE").toUpperCase()
  const formattedDate = format(date, "MMM d")

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <div className="text-center mb-2">
        <div className="text-xs text-[#999] font-medium">{day}</div>
        <div className="text-sm text-white font-semibold">{formattedDate}</div>
      </div>
      <div className="flex gap-3">
        {group.items.map((game: any) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  )
}

function GameCard({ game }: { game: any }) {
  const router = useRouter()
  const { time, volume, team1, team2, odds } = game
  const formattedTime = time.split(", ")[1] || time

  const handleClick = () => {
    router.push(`/markets/sports/${game.leagueAbbreviation}/${game.id}/details`)
  }

  return (
    <div
      onClick={handleClick}
      className="flex cursor-pointer flex-col bg-[#1c1d20] rounded-md px-3 py-2 border border-[#353739] gap-4"
    >
      <div className="flex justify-between items-center text-xs gap-2 text-white font-medium">
        <span className="bg-[#353739] px-2 py-0.5 rounded-sm">
          {formattedTime}
        </span>
        <span className="text-[#999]">
          ${parseFloat(volume).toLocaleString()} Vol.
        </span>
      </div>

      {[team1, team2].map((team, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-2 text-white text-sm"
        >
          <div className="flex items-center gap-2">
            <Image
              src={team.logo}
              alt={team.shortName}
              width={20}
              height={20}
              className="w-5 h-5 rounded-full"
            />
            <span className="text-xs font-medium">{team.shortName}</span>
          </div>
          <span className="text-xs text-[#ccc] font-medium">
            {odds[`team${idx + 1}`]}
          </span>
        </div>
      ))}
    </div>
  )
}

function DayColumnSkeleton() {
  return (
    <div className="flex flex-col gap-2 min-w-[200px] animate-pulse">
      <div className="flex gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col bg-[#1c1d20] rounded-md px-3 py-2 border border-[#353739] gap-4 w-[160px]"
          >
            <div className="flex justify-between items-center text-xs gap-2">
              <div className="bg-[#2a2b2f] h-4 w-12 rounded-sm" />
              <div className="bg-[#2a2b2f] h-4 w-10 rounded-sm" />
            </div>
            {Array.from({ length: 2 }).map((_, j) => (
              <div
                key={j}
                className="flex items-center justify-between gap-2 text-white text-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#2a2b2f] rounded-full" />
                  <div className="bg-[#2a2b2f] h-4 w-12 rounded-sm" />
                </div>
                <div className="bg-[#2a2b2f] h-4 w-6 rounded-sm" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
