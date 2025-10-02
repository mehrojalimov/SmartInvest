import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export const PortfolioOverview = () => {
  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }
      return response.json();
    },
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
  });

  const portfolio = portfolioData?.portfolio || [];
  const transactions = transactionsData?.transactions || [];
  const totalAssets = portfolio.length;
  const totalTransactions = transactions.length;

  const stats = [
    {
      title: "Total Portfolio Value",
      value: "$0.00", // This would need real-time stock prices to calculate
      change: "+0.0%",
      isPositive: true,
      icon: DollarSign,
      gradient: "bg-gradient-primary",
    },
    {
      title: "Today's Change",
      value: "$0.00",
      change: "+0.0%",
      isPositive: true,
      icon: TrendingUp,
      gradient: "bg-gradient-success",
    },
    {
      title: "Total Return",
      value: "$0.00",
      change: "+0.0%",
      isPositive: true,
      icon: TrendingUp,
      gradient: "bg-gradient-success",
    },
    {
      title: "Assets",
      value: totalAssets.toString(),
      change: `${totalTransactions} transactions`,
      isPositive: true,
      icon: PieChart,
      gradient: "bg-primary",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-muted"></div>
              <div className="w-16 h-4 bg-muted rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="w-24 h-4 bg-muted rounded"></div>
              <div className="w-32 h-6 bg-muted rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.isPositive ? TrendingUp : TrendingDown;
        
        return (
          <Card
            key={index}
            className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/50"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.gradient} flex items-center justify-center shadow-glow`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.isPositive ? "text-success" : "text-destructive"
              }`}>
                <TrendIcon className="w-4 h-4" />
                {stat.change}
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
