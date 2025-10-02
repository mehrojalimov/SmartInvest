import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PortfolioOverview } from "@/components/dashboard/PortfolioOverview";
import { AssetCards } from "@/components/dashboard/AssetCards";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { StockSearch } from "@/components/dashboard/StockSearch";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { RealTimeMarketData } from "@/components/dashboard/RealTimeMarketData";
import { StockScreener } from "@/components/dashboard/StockScreener";
import { PortfolioAnalytics } from "@/components/dashboard/PortfolioAnalytics";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <PortfolioOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PerformanceChart />
          </div>
          <div>
            <AssetCards />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StockSearch />
          <RecentTransactions />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RealTimeMarketData />
          <MarketOverview />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StockScreener />
          <PortfolioAnalytics />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
