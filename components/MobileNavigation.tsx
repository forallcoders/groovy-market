"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/Avatar/avatar"
import { Button } from "@/components/ui/Button/Button"
import {
  DialogContent as BaseDialogContent,
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useUserContext } from "@/providers/user-provider"
import { useDynamicContext } from "@dynamic-labs/sdk-react-core"
import {
  Copy,
  FileCheckIcon,
  HelpCircleIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
  XIcon
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useEffect, useState } from "react"

const DialogContent = React.forwardRef<
  React.ElementRef<typeof BaseDialogContent>,
  React.ComponentPropsWithoutRef<typeof BaseDialogContent>
>(({ className, ...props }, ref) => {
  const { user } = useUserContext()

  return (
    <DialogPortal>
      <DialogOverlay className="fixed inset-0 bg-black/50" />
      <BaseDialogContent
        ref={ref}
        className={cn(
          "fixed right-4 bottom-0 w-[calc(100%-2rem)] rounded-xl border border-[#55595D] bg-[#29292C] p-0 shadow-xl overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800",
          "data-[state=open]:animate-in h-full data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4",
          !user
            ? "min-h-[calc(520px)]  max-h-[min(calc(100vh-7rem),480px)]"
            : " max-h-[min(calc(44vh),480px)]",
          className
        )}
        {...props}
      />
    </DialogPortal>
  )
})
DialogContent.displayName = "DialogContent"

interface ActiveMarket {
  name: string;
  percentage: string;
}

interface EndedMarket {
  name: string;
  result: "Yes" | "No";
  hasMore: boolean;
}

export function MobileNavigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { user, logout } = useUserContext()
  const { setShowAuthFlow } = useDynamicContext()
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const searches = ["Search 1", "Search 1", "Search 1"];
  const tags = ["New", "Breaking News", "March Madness", "Economy"];
  const topics = Array(6).fill("Middle East");
  
  const marketResults = {
    active: [
      { name: "Market Name", percentage: "23%" },
      { name: "Market Name", percentage: "23%" },
      { name: "Market Name", percentage: "23%" },
    ] as ActiveMarket[],
    ended: [
      { name: "Market Name", result: "Yes" as const, hasMore: false },
      { name: "Market Name", result: "Yes" as const, hasMore: true },
      { name: "Market Name", result: "No" as const, hasMore: false },
    ] as EndedMarket[],
  };

  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSearchOpen]);

  const copyToClipboard = async () => {
    if (!user?.proxyWallet) return
    try {
      await navigator.clipboard.writeText(user.proxyWallet)
      toast({
        title: "Address copied to clipboard",
        description: "You can now paste it in your wallet",
      })
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  useEffect(() => {
    if (open) {
      setOpen(false)
    }
  }, [pathname])

  const navItems = [
    { name: "Markets", href: "/markets", icon: "/icons/grid.svg" },
    {
      name: "Activity",
      href: "/markets/activity",
      icon: "/icons/chart-up.svg",
    },
    {
      name: "Leaders",
      href: "/markets/leaderboards",
      icon: "/icons/trophy.svg",
    },
    {
      name: "Search",
      href: "/markets/search",
      icon: "/icons/search.svg",
    },
  ]

  const isActiveMarket = (market: ActiveMarket | EndedMarket): market is ActiveMarket => {
    return 'percentage' in market;
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-[#141414] z-40 pb-[60px] mt-14 transition-all duration-300 transform ${
          isSearchOpen 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="p-4">
          <div className="relative mt-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 peer-focus:text-[#7272FF]" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search markets"
              className="peer bg-[#353539] rounded-full pl-10 pr-4 py-[6px] text-sm w-full text-white focus:outline-none focus:ring-1 focus:ring-[#7272FF] placeholder:text-gray-400 placeholder:text-[13px] placeholder:font-light"
            />
          </div>

          {!searchValue ? (
            <>
              <div className="mt-6 animate-in slide-in-from-bottom duration-500">
                <h3 className="text-white text-sm font-semibold mb-2">Recent</h3>
                {searches.map((search, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-[#353739] hover:bg-[#4B4E50] pl-3 mb-2 rounded transition-colors"
                  >
                    <span className="text-white text-[13px] font-semibold">
                      {search}
                    </span>
                    <button className="hover:bg-[#4A4A4E] p-1 rounded-full">
                      <XIcon className="h-6 w-6 text-[#A4A4AE]" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#494B4E] my-4"></div>
            </>
          ) : null}

          <div className={!searchValue ? "animate-in slide-in-from-bottom  duration-500 delay-150" : "mt-6"}>
            <h3 className="text-white text-sm font-semibold mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <button
                  key={index}
                  className="bg-[#353739] font-semibold hover:bg-[#4B4E50] min-w-[70px] text-white text-[13px] px-[20px] py-1 rounded-[5px] transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {searchValue ? (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab("active")}
                    className={`text-[13px] font-semibold ${
                      activeTab === "active" ? "text-white" : "text-gray-400"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setActiveTab("ended")}
                    className={`text-[13px] font-semibold ${
                      activeTab === "ended" ? "text-white" : "text-gray-400"
                    }`}
                  >
                    Ended
                  </button>
                </div>
                <button className="text-[#7272FF] text-[13px] font-semibold">
                  See all
                </button>
              </div>

              <div className="space-y-2">
                {(activeTab === "active" ? marketResults.active : marketResults.ended).map((market, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border border-[#494B4E] p-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-[30px] h-[30px] bg-[#59595d] rounded"></div>
                      <span className="text-white text-[13px] font-semibold">
                        {market.name}
                      </span>
                    </div>
                    {isActiveMarket(market) ? (
                      <span className="text-white text-[13px] font-semibold">
                        {market.percentage}
                      </span>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span 
                          className={`text-[13px] font-semibold ${
                            market.result === "Yes" ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {market.result}
                        </span>
                        {market.hasMore && (
                          <span className="text-[11px] text-gray-400">+10 more</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="border-t border-[#494B4E] my-4"></div>
              <div className="animate-in slide-in-from-bottom duration-500 delay-300">
                <h3 className="text-white text-sm font-semibold mb-3">Topics</h3>
                <div className="grid grid-cols-2 gap-2">
                  {topics.map((topic, index) => (
                    <button
                      key={index}
                      className="bg-[#2C2C2E] hover:border-[#FFFFFF] font-semibold border border-[#494B4E] transition-colors text-white text-[13px] p-[10px] rounded-lg text-left flex items-center gap-3"
                    >
                      <div className="w-[30px] h-[30px] bg-[#59595d] rounded"></div>
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-zinc-800/50 md:hidden z-50">
        <div className="flex items-center justify-between px-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center p-2 ${
                pathname === item.href ? "text-purple-500" : "text-zinc-400"
              }`}
            >
              <Image
                src={item.icon}
                alt={item.name}
                width={22}
                height={22}
                className={
                  pathname === item.href ? "text-purple-500" : "text-zinc-400"
                }
              />
              <span className="text-xs mt-1 font-medium">{item.name}</span>
            </Link>
          ))}

          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="flex flex-col items-center p-2 text-zinc-400"
          >
            {isSearchOpen ? (
              <XIcon size={22} strokeWidth={2} />
            ) : (
              <SearchIcon size={22} strokeWidth={2} />
            )}
            <span className="text-xs mt-1">Search</span>
          </button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="flex flex-col items-center p-2 text-zinc-400">
                {open ? (
                  <XIcon size={22} strokeWidth={2} />
                ) : (
                  <MenuIcon size={22} strokeWidth={2} />
                )}
                <span className="text-xs mt-1">More</span>
              </button>
            </DialogTrigger>

            <DialogContent>
              <DialogTitle className="sr-only">User Menu</DialogTitle>
              <div className="p-4 relative">
                {!user ? (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex gap-2 mt-12 w-full">
                        <Button
                          variant="berry"
                          onClick={() => setShowAuthFlow(true)}
                          className="flex-1 bg-[#CC0066] text-white font-bold"
                        >
                          Sign Up
                        </Button>

                        <Button
                          variant="gray"
                          onClick={() => setShowAuthFlow(true)}
                          className="flex-1 bg-[#9900CC] text-white font-bold"
                        >
                          Log In
                        </Button>
                      </div>

                      <div className="h-[1px] w-full bg-[#494B4E]" />

                      <Link
                        href="/markets/terms-and-conditions"
                        className="flex items-center gap-3 text-zinc-400 hover:text-zinc-300"
                      >
                        <FileCheckIcon size={18} strokeWidth={1.5} />
                        <span className="text-[15px]">Terms of use</span>
                      </Link>
                      <Link
                        href="https://t.me/+Fzwl4cakdTA2M2Rh"
                        target="_blank"
                        rel="noopener"
                        className="flex items-center gap-3 text-zinc-400 hover:text-zinc-300"
                      >
                        <HelpCircleIcon size={18} strokeWidth={1.5} />
                        <span className="text-[15px]">Support</span>
                      </Link>
                      <div className="flex items-center gap-3 text-zinc-400 hover:text-zinc-300 cursor-pointer">
                        <svg
                          className="w-[18px] h-[18px]"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span className="text-[15px]">Follow us</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || ""} />
                            <AvatarFallback>
                              {user.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[18px] text-white font-medium">
                            {user.username}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          className="rounded-sm bg-transparent border-[#55595D] text-[13px] font-mono text-zinc-400"
                          value={user.proxyWallet || ""}
                          readOnly
                        />
                        <Button
                          variant="gray"
                          size="icon"
                          className="rounded-sm"
                          onClick={copyToClipboard}
                        >
                          <span className="sr-only">Copy address</span>
                          <Copy className="h-5 w-5 text-gray-400 fill-gray" />
                        </Button>
                      </div>

                      <div className="h-[1px] w-full bg-[#494B4E] absolute left-0 right-0"></div>

                      <div className="border border-[#55595D] rounded-md px-12 py-2 bg-transparent mt-8">
                        <p className="text-[13px] text-white mb-2 text-center">
                          You are using <strong>Testnet Playground</strong>
                        </p>
                        <button className="w-full bg-[#4A5565] text-[13px] text-white py-2 font-bold rounded-md text-center transition-colors borde border-zinc-800">
                          Switch to Live Markets
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 mt-6">
                      <Link
                        href={"/markets/profile" + `/${user.proxyWallet}`}
                        className="flex items-center gap-3 text-zinc-400 hover:text-zinc-300"
                      >
                        <UserIcon size={18} strokeWidth={1.5} />
                        <span className="text-[15px]">Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 text-zinc-400 hover:text-zinc-300"
                      >
                        <SettingsIcon size={18} strokeWidth={1.5} />
                        <span className="text-[15px]">Settings</span>
                      </Link>
                      <Link
                        href="/markets/terms-and-conditions"
                        className="flex items-center gap-3 text-zinc-400 hover:text-zinc-300"
                      >
                        <FileCheckIcon size={18} strokeWidth={1.5} />
                        <span className="text-[15px]">Terms of use</span>
                      </Link>
                      <Link
                        href="https://t.me/+Fzwl4cakdTA2M2Rh"
                        target="_blank"
                        rel="noopener"
                        className="flex items-center gap-3 text-zinc-400 hover:text-zinc-300"
                      >
                        <HelpCircleIcon size={18} strokeWidth={1.5} />
                        <span className="text-[15px]">Support</span>
                      </Link>
                      <Link
                        href="https://x.com/GroovyMarket_"
                        target="_blank"
                        rel="noopener"
                        className="flex items-center gap-3 text-zinc-400 hover:text-zinc-300 cursor-pointer"
                      >
                        <svg
                          className="w-[18px] h-[18px]"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span className="text-[15px]">Follow us</span>
                      </Link>

                      <div className="h-[1px] w-full bg-[#494B4E] absolute left-0 right-0"></div>

                      <button
                        onClick={logout}
                        className="flex items-center gap-3 text-red-400 hover:text-red-300 mt-8"
                      >
                        <LogOutIcon size={18} strokeWidth={1.5} />
                        <span className="text-[15px]">Log Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </nav>
    </>
  )
}
