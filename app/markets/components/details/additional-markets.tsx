'use client'

import { useState } from "react";

import SearchBar from "@/app/markets/components/searchbar";
import { ExpandableContent } from "@/components/ui/expandable-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tabs = ['All', 'Everton', 'Arsenal', 'Goals', 'Fouls', 'Penalties']
const rules = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scr"

const AdditionalMarketItem = () => (
  <div className="rounded-[10px] border-[1.5px] border-[#353739] p-2 pl-4 flex justify-between items-center">
    <div>
      <div className="flex gap-3 text-sm">
        <span className="font-medium">Fouls.</span><span className="font-light">Everton &gt; 5</span>
      </div>
      <ExpandableContent previewLines={0} expandText="Rules">
        <p className="text-[13px] font-light">{rules}</p>
      </ExpandableContent>
    </div>
    <div className="flex gap-2">
      <button className="w-[26vw] max-w-26 py-1.5 bg-[#00CC66] flex gap-2 justify-center rounded-[5px] font-semibold text-[13px]">
        <span className="text-white/70">Yes</span><span>45¢</span>
      </button>
      <button className="w-[26vw] max-w-26 py-1.5 bg-[#4E5458] flex gap-2 justify-center rounded-[5px] font-semibold text-[13px]">
        <span className="text-white/70">No</span><span>45¢</span>
      </button>
    </div>
  </div>
)

export default function AdditionalMarkets() {
  const [activeTab, setActiveTab] = useState('All')

  return (
    <div>
      <div className="flex justify-between">
        <h3 className="text-lg font-medium">Additional Markets</h3>
        <SearchBar className="w-[280px]" placeholder="Search markets" />
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='gap-0 sm:gap-2 bg-transparent text-[#81898E]'>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="data-[state=active]:text-white font-regular text-xs data-[state=active]:bg-[#353739] rounded-[2px] hover:text-white hover:bg-[#353739] !border-0"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent className="flex flex-col gap-2" value='All'>
          <AdditionalMarketItem />
          <AdditionalMarketItem />
          <AdditionalMarketItem />
          <AdditionalMarketItem />
        </TabsContent>
      </Tabs>
    </div>
  );
}