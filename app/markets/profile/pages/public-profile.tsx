import MyMarkets from "@/app/markets/profile/components/my-markets";

export type UserData = {
  imageUrl?: string | null;
  username: string;
  profileLink: string;
  proxyWallet: string;
  bio?: string | null;
  balance: {
    portfolio: number;
    cash: number;
  };
  performanceMetrics: Array<{
    description: string;
    value: number;
  }>;
};

export function PublicProfilePage({ userData }: { userData: UserData }) {
  return <MyMarkets userData={userData} />;
}
