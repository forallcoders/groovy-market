import Link from "next/link";
import MarketHeader from "./markets/components/header/market-header";
import Onboarding from "@/components/flows/onboarding";
import { MobileNavigation } from "@/components/MobileNavigation";
import Footer from "./markets/components/footer";

export default function NotFound() {
  return (
    <div className="bg-[#141414] min-h-screen flex flex-col">
      <MarketHeader />
      <Onboarding />

      <div className="flex flex-col items-center justify-start min-h-[70vh] pt-14 sm:pt-22 flex-1 text-foreground px-4">
        <div className="flex space-x-2 sm:space-x-4 text-7xl sm:text-9xl font-bold mb-2 sm:mb-4 gap-6 sm:gap-22">
          <span className="text-[#CC99FF]">4</span>
          <span className="text-[#99FFCC]">0</span>
          <span className="text-[#FFFF99]">4</span>
        </div>
        <p className="mb-4 sm:mb-6 text-lg sm:text-2xl mt-4 sm:mt-8 text-white font-bold text-center">
          Page doesn&apos;t exist
        </p>
        <Link
          href="/markets"
          className="px-4 py-2 rounded bg-pink-600 text-white font-semibold hover:bg-pink-700 transition text-base sm:text-lg"
        >
          Go to Homepage
        </Link>
      </div>

      <MobileNavigation />
      <Footer />
    </div>
  );
}
