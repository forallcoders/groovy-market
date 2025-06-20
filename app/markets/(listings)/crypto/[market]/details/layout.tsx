import MarketsPanelWrapper from "@/app/markets/components/order/market-panel-wrapper"
import React from "react"

const DetailsLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid grid-cols-1 gap-6 mt-4 sm:mt-6">
      {/* Main Content */}
      {children}

      {/* Right Sidebar */}
      <MarketsPanelWrapper />
    </div>
  )
}

export default DetailsLayout
