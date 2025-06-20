"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"
import Footer from "../components/footer"
import { Text } from "@/components/ui/Text/text"
import { Card } from "@/components/ui/Card/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/Avatar/avatar"
import { useLeaderboardProfit } from "@/hooks/leaderboard/use-leaderboard-profit"
import { useLeaderboardVolume } from "@/hooks/leaderboard/use-leaderboard-volume"
import Link from "next/link"

export default function LeaderboardsPage() {
  const [filterSelected, setFilterSelected] = useState("Day")
  const [tabSelected, setTabSelected] = useState("volume")
  const { leaderboardProfit } = useLeaderboardProfit()
  const { leaderboardVolume } = useLeaderboardVolume()
  const filterOptions = ["Day", "Week", "Month", "All"]
  const tabOptions = ["volume", "profit"]

  const renderContent = (leaderboardData: any[], type: string) => (
    <Card className="p-3">
      <div className="flex items-center gap-2 cursor-pointer mb-5">
        <div className={"w-[30px] h-[30px] rounded-full bg-neutral-800"} />
        <span className={"font-semibold text-lg capitalize text-white"}>
          {type}
        </span>
      </div>
      {leaderboardData?.map((item, index) => (
        <div key={index} className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <span
              className={cn(
                "text-[11px] font-bold text-neutral-500 flex size-4 items-center justify-center rounded-full",
                index < 3 && "text-black",
                index === 0 && "bg-amber-400",
                index === 1 && "bg-[#A9E2FF]",
                index === 2 && "bg-[#FFB5A1]"
              )}
            >
              {index + 1}
            </span>
            <Avatar className="w-7.5 h-7.5">
              <AvatarImage src={item.avatar || ""} />
              <AvatarFallback />
            </Avatar>
            <Link href={`/markets/profile/${item.proxyWallet}`}>
              <Text className="text-sm text-neutral-400 font-semibold hover:text-white hover:underline">
                {item.username}
              </Text>
            </Link>
          </div>
          <Text className="text-sm">{item[type]}</Text>
        </div>
      ))}
    </Card>
  )

  return (
    <>
      <main className="grow bg-[#141414] min-h-[700px] py-8 text-white px-4 sm:px-0">
        <div className="max-w-[800px] mx-auto sm:px-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col md:flex-row gap-2 justify-between mb-4">
              <div className="flex gap-2 items-baseline">
                <h1 className="text-3xl font-medium">Leaderboard</h1>
                {/* <Text className="text-xs text-[#81898E]" muted>
                  Resets in 22h 19m 3s
                </Text> */}
              </div>
              <div className="flex gap-3 pt-2 md:pt-0">
                {filterOptions.map((option) => (
                  <span
                    key={option}
                    className={cn(
                      "text-[13px] font-semibold p-1 rounded-sm h-7 px-5 cursor-pointer",
                      option === filterSelected
                        ? "bg-white text-black"
                        : "bg-neutral-800"
                    )}
                    onClick={() => setFilterSelected(option)}
                  >
                    {option}
                  </span>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex md:hidden w-full mb-2 gap-4">
              {tabOptions.map((tab) => (
                <button
                  key={tab}
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setTabSelected(tab)}
                >
                  <div
                    className={cn(
                      "w-[30px] h-[30px] rounded-full",
                      tabSelected === tab ? "bg-white" : "bg-neutral-800"
                    )}
                  />
                  <span
                    className={cn(
                      "font-medium capitalize",
                      tabSelected === tab ? "text-white" : "text-neutral-400"
                    )}
                  >
                    {tab}
                  </span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="hidden md:grid md:grid-cols-2 gap-4">
              {renderContent(leaderboardVolume, "volume")}
              {renderContent(leaderboardProfit, "profit")}
            </div>

            {/* Mobile Content */}
            <div className="md:hidden">
              {renderContent(
                tabSelected === "volume"
                  ? leaderboardVolume
                  : leaderboardProfit,
                tabSelected
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
