import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DashboardHeader = () => {
  return (
    <header className="bg-gradient-primary border-b border-primary/20">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SmartInvest</h1>
              <p className="text-sm text-white/80">Investment Portfolio Tracker</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm">
              Add Asset
            </Button>
            <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Settings
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
