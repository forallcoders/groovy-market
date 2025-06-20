/* eslint-disable @next/next/no-img-element */
"use client"

import { useMarketContext } from "@/providers/market-provider"
import { slugify } from "@/utils/slugify"
import Link from "next/link"
import { usePathname } from "next/navigation"

function shortname(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
}

export default function LeagueSelector() {
  const pathname = usePathname()
  const currentLeague = pathname.split("/").at(-1) || ""
  const { leagues } = useMarketContext()

  if (!leagues || leagues.length === 0) {
    return (
      <div className="flex sm:flex-col px-4 sm:px-0 gap-4 pb-4 sm:pb-0 border-b-2 border-b-[#353739] sm:border-b-0 overflow-x-auto">
        {Array(4)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className="min-w-24 sm:w-full h-12 bg-[#2a2a2a] animate-pulse rounded-sm"
            ></div>
          ))}
      </div>
    )
  }

  return (
    <div className="flex sm:flex-col px-4 sm:px-0 gap-4 pb-4 sm:pb-0 border-b-2 border-b-[#353739] sm:border-b-0 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-[#00000000]">
      {leagues.map((league) => {
        // Check if this league is selected
        const isSelected = currentLeague === slugify(league.name)

        return (
          <Link
            key={league.id}
            href={`/markets/sports/${slugify(league.name)}`}
            className={`min-w-24 sm:w-full flex items-center gap-3 p-[5px] rounded-sm transition-colors ${
              isSelected
                ? "bg-[#333] text-white"
                : "text-gray-400 hover:bg-[#2a2a2a]"
            }`}
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-sm">
              {league.logo ? (
                <img
                  className="rounded-md h-full w-full object-cover"
                  width={60}
                  height={60}
                  alt={`${league.name} logo`}
                  src={league.logo}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-700 rounded-md"></div>
              )}
            </div>
            <span className="text-base font-semibold uppercase">
              {league?.short_name ?? shortname(league.name)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
