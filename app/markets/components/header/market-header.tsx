"use client";

import Navbar from "@/app/markets/components/header/navbar";
import SearchBar from "@/app/markets/components/searchbar";
import Image from "next/image";
import Link from "next/link";
import UserNavigation from "./user-navigation";

export default function MarketHeader() {
  return (
    <header className="bg-[#29292C] text-white py-2">
      <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/markets">
            <Image
              src="/images/gm-beta-logo.svg"
              alt="Gridly Market"
              width={108}
              height={68}
              className="h-[34px] w-[66px]"
            />
          </Link>

          <SearchBar
            placeholder="Search markets"
            className="hidden sm:flex w-[280px]"
          />
        </div>

        <Navbar className="hidden lg:flex" />
        <UserNavigation />
      </div>
    </header>
  );
}
