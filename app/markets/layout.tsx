import MarketHeader from "@/app/markets/components/header/market-header";
import Onboarding from "@/components/flows/onboarding";
import { MobileNavigation } from "../../components/MobileNavigation";

export default function MarketsSportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketHeader />
      <Onboarding />
      {children}
      <MobileNavigation />
    </div>
  );
}
