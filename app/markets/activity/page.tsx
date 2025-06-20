/* eslint-disable @next/next/no-img-element */
"use client"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/Avatar/avatar"
import { Text } from "@/components/ui/Text/text"
import { useUserActivity } from "@/hooks/use-user-activity"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import Footer from "../components/footer"

export default function ActivityPage() {
  return (
    <>
      <main className="grow bg-[#141414] min-h-[700px] py-8 text-white px-4 sm:px-0">
        <div className="max-w-[800px] mx-auto sm:px-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between mb-4">
              <h1 className="text-2xl font-medium">Activity</h1>
              {/* <DropdownField
                className="w-[200px]"
                placeholder="Min amount"
                options={[]}
              /> */}
            </div>
            <ActivityTable />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

const ActivityTable = () => {
  const { isLoading, isError, activities } = useUserActivity()
  console.log({ activities })
  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error</div>
  if (activities.length === 0) return <div>No activities</div>
  return activities.map((activity, index) => {
    const timeAgo = formatDistanceToNow(new Date(activity.details.date), {
      addSuffix: true,
      includeSeconds: true,
    })
    const isSport = activity.market.league !== null
    const url = isSport ? `/markets/sports/${activity.market.league}/${activity.market.id}/details` : `/markets/crypto/${activity.market.id}/details`
    return (
      <div
        className="flex gap-2 items-center pb-4 border-b-1 border-b-neutral-600"
        key={index}
      >
        <img
          src={activity.market.image}
          alt={activity.market.description}
          width={65}
          height={65}
          className="w-[50px] h-[50px]"
        />
        <div className="w-full flex justify-between items-center">
          <div>
            <Link
              href={url}
            >
              <Text className="text-neutral-400 text-lg font-semibold">
                {activity.market.description}
              </Text>
            </Link>
            <div className="flex gap-2 items-center">
              <Link href={`/markets/profile/${activity.user.proxyWallet}`}>
                <Avatar className="size-5">
                  <AvatarImage src={activity.user.avatar || ""} />
                  <AvatarFallback />
                </Avatar>
              </Link>
              {activity.type !== "MERGE" && activity.type !== "SPLIT" && (
                <Text className="text-xs">
                  <Link
                    href={`/markets/profile/${activity.user.proxyWallet}`}
                    className="text-neutral-400"
                  >
                    {activity.user.username}
                  </Link>{" "}
                  {activity.type === "BUY" ? "bought" : "sold"}{" "}
                  <span className="text-[#DE4702]">
                    {activity.market.outcome}
                  </span>{" "}
                  at {Number(activity.market.pricePerShare).toFixed(2)}{" "}
                  <span className="text-neutral-400">
                    (${activity.details.amount.toFixed(2)})
                  </span>
                </Text>
              )}
              {activity.type === "MERGE" && (
                <Text className="text-xs">
                  <Link
                    href={`/markets/profile/${activity.user.proxyWallet}`}
                    className="text-neutral-400"
                  >
                    {activity.user.username}
                  </Link>{" "}
                  merged {activity.details.amount} shares
                </Text>
              )}
              {activity.type === "SPLIT" && (
                <Text className="text-xs">
                  <Link
                    href={`/markets/profile/${activity.user.proxyWallet}`}
                    className="text-neutral-400"
                  >
                    {activity.user.username}
                  </Link>{" "}
                  split {activity.details.amount} shares
                </Text>
              )}
            </div>
          </div>
          <Text className="text-xs" muted>
            {timeAgo}
          </Text>
        </div>
      </div>
    )
  })
}
