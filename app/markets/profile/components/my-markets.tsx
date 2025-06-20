"use client"

import { Copy } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/Avatar/avatar"
import { Button } from "@/components/ui/Button/Button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Text } from "@/components/ui/Text/text"
import { cn } from "@/lib/utils"

import SearchBar from "@/app/markets/components/searchbar"
import { TableInformation } from "@/app/markets/profile/components/table-information"
import {
  activityTableColumnSchema,
  openOrdersTableColumnSchema,
  positionsTableColumnSchema,
} from "@/app/markets/profile/config/table-columns-schemas"
import DropdownField from "@/components/ui/Dropdown/dropdown-field"
import { toast } from "@/hooks/use-toast"
import { useUserActivity } from "@/hooks/use-user-activity"
import { useUserPublicOrders } from "@/hooks/use-user-public-orders"
import { useUserPublicPositions } from "@/hooks/use-user-public-positions"
import { useUserContext } from "@/providers/user-provider"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserData } from "../pages/public-profile"

const MOCKED_VALUES_1 = [
  { value: "initial", label: "Initial value" },
  { value: "other", label: "Other" },
]

const MOCKED_VALUES_2 = [
  { value: "all", label: "All" },
  { value: "other", label: "Other" },
]

const FilterOptions = () => (
  <div className="flex flex-col md:items-center md:flex-row gap-2">
    <SearchBar className="w-32" placeholder="Search" />
    <div className="flex gap-2">
      <DropdownField
        placeholder="Select category"
        options={MOCKED_VALUES_1}
        className="w-36 bg-neutral-600 text-white text-[13px] focus-visible::ring-0 data-[placeholder]:text-white/80"
        value="initial"
        variant="gray"
        onValueChange={() => {}}
      />
      <DropdownField
        placeholder="Select category"
        options={MOCKED_VALUES_2}
        className="w-24 bg-neutral-600 text-white text-[13px] focus-visible::ring-0 data-[placeholder]:text-white/80"
        value="all"
        variant="gray"
        onValueChange={() => {}}
      />
    </div>
  </div>
)

export default function MyMarkets({ userData }: { userData: UserData }) {
  const [activeTab, setActiveTab] = useState("Positions")
  const router = useRouter()
  const { user } = useUserContext()
  const isPrivateView = user?.proxyWallet === userData.proxyWallet
  const tabs = isPrivateView
    ? ["Positions", "Open orders", "Activity"]
    : ["Positions", "Open orders", "Activity"]

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Mobile Top Navigation */}
      <div className="md:hidden">
        <div className="flex justify-between items-center px-4 py-3 bg-neutral-900">
          <Text className="text-white font-medium">My Markets</Text>
          <Button
            variant="berry"
            size="sm"
            onClick={() => router.push("/markets/create")}
          >
            Create a market
          </Button>
        </div>
        <div className="h-px bg-neutral-800 w-full" />
      </div>

      <div className="flex flex-col gap-5 px-4 md:px-0 mt-4 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center overflow-hidden">
          <div className="flex items-center gap-4 overflow-hidden">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={userData.imageUrl || ""} />
              <AvatarFallback />
            </Avatar>
            <div className="flex flex-col w-full overflow-hidden">
              <Text variant="lead" weight="medium">
                {userData.username}
              </Text>
              {/* Mobile Profile Link */}
              <div className="flex md:hidden items-center w-full mt-1 max-w-full">
                <div className="w-[100%] min-w-0 bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 mr-2 overflow-hidden">
                  <div className="w-full overflow-hidden">
                    <Text
                      className="text-[13px] text-neutral-400 truncate block w-full font-light"
                      variant="tiny"
                    >
                      {userData.proxyWallet}
                    </Text>
                  </div>
                </div>
                <Button
                  className="bg-gray-600 w-6 h-6 p-0 min-w-6 shrink-0"
                  variant="link"
                >
                  <Copy className="text-white w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          {isPrivateView && (
            <Button
              variant="gray"
              size="sm"
              className="w-32 text-white font-semibold"
              asChild
            >
              <Link href="/markets/profile/settings">Edit profile</Link>
            </Button>
          )}
        </div>

        {/* Bio and Profile Link Container */}
        <div className="flex flex-col md:flex-row md:justify-between md:w-full gap-4">
          {/* Information Card */}
          <div className="flex w-full md:w-56 flex-col border-1 border-neutral-800 rounded-lg p-2 text-red-600">
            <Text
              variant="tiny"
              className="whitespace-pre-line text-neutral-400"
            >
              {userData.bio || "No bio yet"}
            </Text>
          </div>

          {/* Desktop Profile Link Card */}
          <div className="hidden md:flex w-full md:w-56 flex-col border-1 border-neutral-800 rounded-lg p-2">
            <Text variant="tiny" className="text-neutral-400">
              Profile link
            </Text>
            <div className="flex gap-2 items-center">
              <Text className="truncate" variant="tiny">
                {userData.profileLink}
              </Text>
              <Button
                className="bg-gray-600 w-8 h-8"
                variant="link"
                onClick={() => {
                  navigator.clipboard.writeText(userData.profileLink!)
                  toast({
                    title: "Profile copied to clipboard",
                    description: "You can now share your profile",
                  })
                }}
              >
                <Copy className="text-white" />
              </Button>
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        {isPrivateView && (
          <div className="w-full flex flex-col md:flex-row gap-6">
            {/* Porfolio Value */}
            <div className="border-2 w-full border-orchid-700 rounded-lg p-3.5">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-neutral-800" />
                <div className="flex flex-col">
                  <Text className="text-sm font-light">Porfolio value</Text>
                  <Text className="text-lg font-medium">
                    $ {userData.balance.portfolio.toFixed(2)}
                  </Text>
                </div>
              </div>
            </div>
            {/* Cash Value */}
            <div className="flex flex-col border-2 w-full border-berry-700 rounded-lg p-3.5 gap-5 -my-2">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-neutral-800" />
                <div className="flex flex-col">
                  <Text className="text-sm font-light">Cash</Text>
                  <Text className="text-lg font-medium">
                    $ {userData.balance.cash.toFixed(2)}
                  </Text>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button className="h-8" variant="berry">
                  Deposit
                </Button>
                <Button className="h-8" variant="gray">
                  Withdraw
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 3 Cards Performance Information */}
        <div className="flex flex-col md:flex-row gap-4">
          {userData.performanceMetrics.map((info) => (
            <div
              key={info.description}
              className="flex md:flex-col gap-4 border-1 w-full border-neutral-800 rounded-lg p-3.5"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-800" />
              <div className="flex flex-col gap-2">
                <Text className="text-sm font-light">{info.description}</Text>
                <Text className="text-lg font-medium leading-none">
                  {info.description === "Markets traded"
                    ? `${info.value}`
                    : `$ ${info.value.toFixed(2)}`}
                </Text>
              </div>
            </div>
          ))}
        </div>
        <MarketsTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
          isPrivateView={isPrivateView}
          userData={userData}
        />
      </div>
    </div>
  )
}

const MarketsTabs = ({
  activeTab,
  setActiveTab,
  tabs,
  isPrivateView,
  userData,
}: {
  activeTab: string
  setActiveTab: (tab: string) => void
  tabs: string[]
  isPrivateView: boolean
  userData: UserData
}) => {
  const { positions: positionsData, isLoading: isPositionsLoading } =
    useUserPublicPositions(userData.proxyWallet)
  const { orders: ordersData, isLoading: isOrdersLoading } =
    useUserPublicOrders(userData.proxyWallet)

  const { activities, isLoading: isActivityLoading } = useUserActivity(
    userData.proxyWallet
  )
  console.log({ activities })


  if (isPositionsLoading || isOrdersLoading || isActivityLoading) {
    return <div>Loading...</div>
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="relative flex flex-col gap-4 mt-4 mb-24"
    >
      <TabsList className="flex w-full h-full p-0 justify-start bg-transparent text-[#81898E] border-b-2 border-neutral-800 rounded-none">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab}
            value={tab}
            className={cn(
              "px-3 md:px-4 py-2 relative -bottom-0.5 cursor-pointer border-b-2 border-transparent justify-start",
              "data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white data-[state=active]:bg-transparent",
              "font-medium text-xs md:text-sm rounded-none hover:text-white"
            )}
          >
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent className="flex-1 flex flex-col gap-2" value="Positions">
        {isPrivateView && (
          <div className="flex justify-between">
            {/* <FilterOptions /> */}
            {/* <Button size="sm" className="px-2 bg-gray-600 hover:bg-gray-400">
              <Image src="/icons/share.svg" alt="logo" width={15} height={15} />
            </Button> */}
          </div>
        )}
        <TableInformation
          data={positionsData}
          columnsSchema={positionsTableColumnSchema as any}
          columnWidths={["auto", "70px", "70px", "70px", "70px", "70px"]}
        />
      </TabsContent>
      <TabsContent className="flex-1 flex flex-col gap-2" value="Open orders">
        {isPrivateView && (
          <div className="flex justify-between">
            {/* <FilterOptions /> */}
            {/* <Button size="sm" className="px-2 bg-gray-600 hover:bg-gray-400">
              <Image src="/icons/share.svg" alt="logo" width={15} height={15} />
            </Button> */}
          </div>
        )}
        <TableInformation
          data={isOrdersLoading ? [] : ordersData}
          columnsSchema={openOrdersTableColumnSchema}
          columnWidths={["auto", "70px", "70px", "70px"]}
        />
      </TabsContent>
      <TabsContent className="flex-1 flex flex-col gap-2" value="Activity">
        {isPrivateView && (
          <div className="flex flex-col lg:flex-row gap-2 justify-between">
            {/* <FilterOptions /> */}
            <div className="flex gap-4 items-center justify-between">
              {/* <Button size="sm" variant="berry" className="px-4">
                Claim winnings
              </Button>
              <Button size="sm" className="px-2 bg-gray-600 hover:bg-gray-400">
                <Image
                  src="/icons/share.svg"
                  alt="logo"
                  width={15}
                  height={15}
                />
              </Button> */}
            </div>
          </div>
        )}
        <TableInformation
          className="md:table-auto"
          data={activities}
          columnsSchema={activityTableColumnSchema}
        />
      </TabsContent>
      {/* {isPrivateView && (
        <TabsContent className="flex-1 flex flex-col gap-2" value="History">
          {isPrivateView && (
            <SearchBar className="w-64" placeholder="Search by hash" />
          )}
          <TableInformation
            className="table-auto"
            data={[]}
            columnsSchema={historyTableColumnSchema}
          />
        </TabsContent>
      )} */}
      <Image
        className="hidden md:flex absolute right-0"
        src="/images/gm-logo.png"
        alt="logo"
        width={54}
        height={34}
      />
    </Tabs>
  )
}
