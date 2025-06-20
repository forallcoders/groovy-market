"use client";

import Footer from "@/app/markets/components/footer";

export default function MarketsSportsLayout({
  children,
}: {
  children: React.ReactNode
}) {


  return (
    <>
      <main className="grow bg-[#141414] md:py-4 text-white">
        <div className="max-w-[1000px] md:min-h-[700px] min-h-[600px] mx-auto sm:px-4">
          <div className="gap-6 md:mt-4 sm:mt-6">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}