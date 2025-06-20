"use client"
import { cn } from "@/lib/utils"
import { useState } from "react"
import SearchBar from "../../components/searchbar"
export default function MarketFilters() {
  const filterOptions = [
    "New",
    "Breaking News",
    "March Madness",
    "Economy",
    "Canada",
  ]
  const [filterSelected, setFilterSelected] = useState()
  return (
    <>
      <div className="flex md:hidden flex-col gap-4">
        {/* <SearchBar className="w-full" placeholder="Search by market" />
        <div className="overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex gap-3 py-2">
            {filterOptions.map((option: any) => (
              <span
                key={option}
                className={cn(
                  "text-[13px] font-semibold p-1 rounded-sm h-7 px-5 cursor-pointer whitespace-nowrap",
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
        </div> */}
        <h2 className="text-xl font-semibold">Sports</h2>
      </div>
      {/* <div className="hidden md:flex gap-2 items-center">
        <SearchBar className="w-[260px]" placeholder="Search by market" />
        <div className="flex gap-3 flex-wrap">
          {filterOptions.map((option: any) => (
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
      </div> */}
    </>
  )
}
