"use client"
import { Button } from "@/components/ui/Button/Button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUserContext } from "@/providers/user-provider"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { useState } from "react"
import Notifications from "../components/notifications"
import PrivateKey from "../components/private-key"
import ProfileSettings from "../components/profile-settings"
import { useRouter } from "next/navigation"

const tabs = ["Profile settings", "Notifications", "Private key"]

const TABS_DIVIDER_INDEX = 2

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(tabs[0])
  const { user, isLoading } = useUserContext()
  const { user: dynamicUser } = useDynamicContext()
  const router = useRouter()

  if (isLoading || !user || !dynamicUser) {
    return <p>Loading</p>
  }

  const parsedUser = {
    ...user,
    email: dynamicUser.email || user.email,
    username: dynamicUser.username,
    bio: (dynamicUser.metadata as Record<string, string>)?.bio || user.bio,
    avatar:
      (dynamicUser.metadata as Record<string, string>)?.avatar || user.avatar,
  }

  return (
    <div className="flex flex-col">
      {/* Mobile Header */}
      <div className="flex md:hidden justify-center gap-4 items-center px-4 py-3 bg-neutral-900">
        <span className="text-[#81898E] text-sm">My Markets</span>
        <Button
          variant="berry"
          size="sm"
          onClick={() => router.push("/markets/create")}
        >
          Create a market
        </Button>
      </div>

      <div className="md:hidden h-px bg-neutral-800 w-full" />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="px-2 md:px-0 flex flex-col md:flex-row gap-4 md:gap-12"
      >
        <TabsList className="h-full rounded-none md:w-[130px] flex md:flex-col gap-6 md:gap-4 overflow-x-auto md:overflow-visible scrollbar-hide px-2 md:px-0 py-3 md:py-0 items-baseline justify-center md:justify-end bg-transparent text-[#81898E] border-b md:border-b-0 border-neutral-800">
          {tabs.map((tab, index) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className={`px-0 cursor-pointer whitespace-nowrap justify-start data-[state=active]:text-white font-medium text-sm md:text-sm data-[state=active]:bg-transparent md:rounded-[2px] hover:text-white ${
                index === TABS_DIVIDER_INDEX &&
                "md:w-full text-left md:pb-5 pr-2 md:pr-5 md:border-r-0 md:border-b-1 border-neutral-800"
              }`}
            >
              {tab}
            </TabsTrigger>
          ))}

          <Button
            className="hidden md:flex md:w-full text-[13px] text-white"
            size="sm"
            variant="berry"
            onClick={() => router.push("/markets/create")}
          >
            Create a market
          </Button>
        </TabsList>

        <TabsContent
          className="flex-1 flex flex-col gap-2 px-4 md:px-0"
          value="Profile settings"
        >
          <ProfileSettings
            email={parsedUser.email || ""}
            username={parsedUser.username || ""}
            bio={parsedUser.bio || ""}
            avatar={parsedUser.avatar || ""}
          />
        </TabsContent>
        <TabsContent
          className="flex-1 flex flex-col gap-2 px-4 md:px-0"
          value="Notifications"
        >
          <Notifications />
        </TabsContent>
        <TabsContent
          className="flex-1 flex flex-col gap-2 px-4 md:px-0"
          value="Private key"
        >
          <PrivateKey />
        </TabsContent>
      </Tabs>
    </div>
  )
}
