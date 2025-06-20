import React from "react";
import Image from "next/image";

export function CircularMarchChadness() {
  return (
    <>
      {/* Desktop version */}
      <div className="hidden sm:flex justify-center w-[216px] h-[216px] rounded-full border-4 border-white aspect-square bg-[#2424265e]">
        <div className="relative flex flex-col items-center">
          <Image
            src="/logo/march-chadness-logo.svg"
            alt="market-soon"
            width={350}
            height={180}
            className="w-[195px] grayscale-75"
          />
          <Image
            src="/images/neon-closed.svg"
            alt="market-soon"
            width={350}
            height={180}
            className="relative w-[130px] bottom-14"
          />
        </div>
      </div>

      {/* Mobile version */}
      <div className="sm:hidden w-[147px] h-[147px] rounded-full border-4 border-white aspect-square bg-[#2424265e]">
        <div className="relative flex flex-col items-center">
          <Image
            src="/logo/march-chadness-logo.svg"
            alt="market-soon"
            width={350}
            height={180}
            className="w-[120px] grayscale-75"
          />
          <Image
            src="/images/neon-closed.svg"
            alt="market-soon"
            width={350}
            height={180}
            className="relative w-[100px] bottom-8"
          />
        </div>
      </div>
    </>
  );
}
