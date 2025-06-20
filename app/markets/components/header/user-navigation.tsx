import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/Avatar/avatar"
import { Button } from "@/components/ui/Button/Button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { useUserContext } from "@/providers/user-provider"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { ChevronDown, Copy } from "lucide-react"
import Balance from "./balance"

import { toast } from "@/hooks/use-toast"
import Link from "next/link"

export default function UserNavigation() {
  const { user, logout } = useUserContext()
  const { setShowAuthFlow } = useDynamicContext()
  const navigationLinks = [
    { name: "Profile", href: `/markets/profile/${user?.proxyWallet}` },
    { name: "Settings", href: "/markets/profile/settings" },
    { name: "Terms of use", href: "/markets/terms-and-conditions" },
  ]
  if (!user)
    return (
      <div className="flex gap-2">
        <Button
          className="hidden md:block"
          variant="gray"
          size="sm"
          onClick={() => setShowAuthFlow(true)}
        >
          Login
        </Button>
        <Button variant="berry" size="sm" onClick={() => setShowAuthFlow(true)}>
          Sign up
        </Button>
      </div>
    )

  return (
    <>
      <div className="flex gap-2">
        <Balance className="flex" />
        <div className="flex gap-3">
          {/* <button className="p-2 hover:bg-[#333] rounded-full">
            <Bell className="h-5 w-5 text-gray-400 fill-gray" />
          </button> */}

          <div className="hidden md:flex">
            <HoverCard openDelay={0}>
              <HoverCardTrigger>
                <div className="flex items-center gap-0.5 cursor-pointer">
                  <UserAvatar avatar={user.avatar || ""} />
                  <ChevronDown className="w-8 h-8 text-gray-400 fill-gray" />
                </div>
              </HoverCardTrigger>
              <HoverCardContent
                align="end"
                side="top"
                className="bg-[#29292C] text-white border-[#55595D] rounded-[10px] z-50 p-0"
              >
                <div className="px-5 pt-4">
                  <div className="flex items-center gap-2">
                    <UserAvatar avatar={user.avatar || ""} />
                    <p className="text-base font-semibold">{user.username}</p>
                  </div>
                  {user.proxyWallet && (
                    <>
                      <div className="flex items-center gap-2 my-2">
                        <Input
                          className="rounded-sm"
                          value={user.proxyWallet || ""}
                          readOnly
                        />
                        <Button
                          variant="gray"
                          size="icon"
                          className="rounded-sm"
                          onClick={() => {
                            navigator.clipboard.writeText(user.proxyWallet!)
                            toast({
                              title: "Address copied to clipboard",
                              description:
                                "You can now paste it in your wallet",
                            })
                          }}
                        >
                          <span className="sr-only">Copy address</span>
                          <Copy className="h-5 w-5 text-gray-400 fill-gray" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                <div className="h-0.5 w-full bg-[#55595D] my-4" />
                <div className="mx-5 mb-4 px-3 py-2 border border-[#55595D] rounded-sm">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs font-semibold">
                      You are using{" "}
                      <span className="font-semibold">Testnet Playground</span>
                    </p>

                    <Button disabled variant="gray" className="text-xs">
                      Switch to Live Markets
                    </Button>
                  </div>
                </div>
                <div className="px-5">
                  <div className="my-6 flex flex-col gap-2 font-semibold text-base text-[#A4A4AE] ">
                    {navigationLinks.map((link) => (
                      <Link
                        href={link.href || ""}
                        key={link.name}
                        className="hover:text-white hover:underline"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="h-0.5 w-full bg-[#333] mt-5 mb-3" />
                <div className="px-5 pb-2">
                  <Button variant="outline" className="w-full" onClick={logout}>
                    Logout
                  </Button>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </div>
    </>
  )
}

function UserAvatar({ avatar }: { avatar: string }) {
  return (
    <Avatar className="flex h-9 w-9">
      <AvatarImage src={avatar || ""} />
      <AvatarFallback />
    </Avatar>
  )
}
