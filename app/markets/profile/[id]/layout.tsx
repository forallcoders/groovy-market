"use client";

import Footer from "@/app/markets/components/footer";

export default function MarketsSportsLayout({
  children,
}: {
  children: React.ReactNode
}) {


  return (
    <>
      <main className="grow bg-[#141414] pb-4 text-white md:pt-4">
        <div className="max-w-[1000px] min-h-[700px] mx-auto sm:px-4">
          <div className="gap-6 mt-0 md:mt-6">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}