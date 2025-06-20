import React from "react";
import Image from "next/image";

export function CircularMarketComingSoon() {
  return (
    <>
      {/* Desktop version */}
      <div className="hidden sm:flex flex-col justify-center w-[216px] h-[216px] rounded-full border-4 border-white aspect-square bg-[#2424265e]">
        <div className="relative flex flex-col items-center justify-center -top-[12px]">
          <Image
            src="/images/planets.svg"
            alt="market-soon"
            width={350}
            height={180}
            className="w-[161px] grayscale-75"
          />
          <p className="text-[38px] text-[#a0c2b2] font-bold">MARKET</p>
          <Image
            src="/images/neon-coming-soon.svg"
            alt="market-soon"
            width={350}
            height={180}
            className="absolute w-[130px] -bottom-[75px]"
          />
        </div>
      </div>

      {/* Mobile version */}
      <div className="flex sm:hidden flex-col justify-center w-[147px] h-[147px] rounded-full border-4 border-white aspect-square bg-[#2424265e]">
        <div className="relative flex flex-col items-center justify-center -top-[12px]">
          <Image
            src="/images/planets.svg"
            alt="market-soon"
            width={350}
            height={180}
            className="w-[101px] grayscale-75"
          />
          <p className="text-[28px] text-[#a0c2b2] font-bold">MARKET</p>
          <Image
            src="/images/neon-coming-soon.svg"
            alt="market-soon"
            width={350}
            height={180}
            className="absolute w-[100px] -bottom-[55px]"
          />
        </div>
      </div>
    </>
  );
}
