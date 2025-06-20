"use client"

import { useState } from "react"

import MyMarkets from "@/app/markets/profile/components/my-markets"
import Notifications from "@/app/markets/profile/components/notifications"
import PrivateKey from "@/app/markets/profile/components/private-key"
import ProfileSettings from "@/app/markets/profile/components/profile-settings"
import { Button } from "@/components/ui/Button/Button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUserContext } from "@/providers/user-provider"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { UserData } from "./public-profile"
import { useRouter } from "next/navigation"
const tabs = ["Profile settings", "Notifications", "Private key", "My Markets"]

const TABS_DIVIDER_INDEX = 2

export function PrivateProfilePage({ userData }: { userData: UserData }) {
  const [activeTab, setActiveTab] = useState("My Markets")
  const { user } = useUserContext()
  const router = useRouter()
  const { user: dynamicUser } = useDynamicContext()
  if (!user || !dynamicUser) {
    return <p>Loading</p>
  }
  const metadata = dynamicUser.metadata as Record<string, string>
  const parsedUser = {
    ...user,
    email: dynamicUser.email || metadata.email,
    username: dynamicUser.username,
    bio: metadata.bio,
    avatar: metadata.avatar,
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="px-2 md:px-0 flex flex-col md:flex-row gap-4 md:gap-12"
    >
      <TabsList className="h-full md:w-[130px] flex md:flex-col gap-2 md:gap-4 items-baseline justify-center md:justify-end bg-transparent text-[#81898E]">
        {tabs.map((tab, index) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className={`px-0 cursor-pointer justify-start data-[state=active]:text-white font-medium text-xs md:text-sm data-[state=active]:bg-transparent rounded-[2px] hover:text-white ${
              index === TABS_DIVIDER_INDEX &&
              "md:w-full text-left md:pb-5 pr-2 md:pr-5 border-r-1 md:border-r-0 md:border-b-1 border-neutral-800"
            }`}
          >
            {tab}
          </TabsTrigger>
        ))}
        {/* Create Market Button Desktop View */}
        <Button
          className="hidden md:flex md:w-full text-[13px] text-white"
          size="sm"
          variant="berry"
          onClick={() => router.push("/markets/create")}
        >
          Create a market
        </Button>
      </TabsList>

      {/* Create Market Button Mobile View */}
      <Button
        className="w-36 self-center md:hidden text-[13px] text-white"
        size="sm"
        variant="berry"
        onClick={() => router.push("/markets/create")}
      >
        Create a market
      </Button>

      <TabsContent
        className="flex-1 flex flex-col gap-2"
        value="Profile settings"
      >
        <ProfileSettings
          email={parsedUser.email}
          username={parsedUser.username || ""}
          bio={parsedUser.bio || ""}
          avatar={parsedUser.avatar || ""}
        />
      </TabsContent>
      <TabsContent className="flex-1 flex flex-col gap-2" value="Notifications">
        <Notifications />
      </TabsContent>
      <TabsContent className="flex-1 flex flex-col gap-2" value="Private key">
        <PrivateKey />
      </TabsContent>
      <TabsContent
        className="flex-1 flex flex-col gap-2 overflow-x-auto"
        value="My Markets"
      >
        <MyMarkets userData={userData} />
      </TabsContent>
    </Tabs>
  )
}
