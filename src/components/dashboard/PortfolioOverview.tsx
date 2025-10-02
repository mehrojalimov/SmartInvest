import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useStockData } from "@/hooks/usePortfolio";
import { useMemo } from "react";

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

  const { data: cashBalanceData } = useQuery({
    queryKey: ['cashBalance'],
    queryFn: async () => {
      const response = await fetch('/api/cash-balance', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cash balance');
      }
      return response.json();
    },
  });

  const portfolio = portfolioData?.portfolio || [];
  const transactions = transactionsData?.transactions || [];
  const cashBalance = cashBalanceData?.cashBalance || 0;
  const totalAssets = portfolio.length;
  const totalTransactions = transactions.length;

  // Calculate portfolio value using mock prices
  const mockPrices: { [key: string]: number } = {
    'AAPL': 177.30,
    'MSFT': 383.75,
    'TSLA': 249.50,
    'AMZN': 157.25,
    'GOOGL': 144.35,
    'NVDA': 429.75,
    'META': 323.45,
    'NFLX': 488.75,
    'AMD': 127.20,
    'INTC': 43.25
  };

  const portfolioValue = useMemo(() => {
    return portfolio.reduce((total: number, asset: any) => {
      const price = mockPrices[asset.stock_name] || 0;
      return total + (asset.total_quantity * price);
    }, 0);
  }, [portfolio]);

  const totalValue = portfolioValue + cashBalance;
  const previousValue = totalValue * 0.98; // Simulate 2% gain
  const todayChange = totalValue - previousValue;
  const todayChangePercent = previousValue > 0 ? (todayChange / previousValue) * 100 : 0;

  const stats = [
    {
      title: "Total Portfolio Value",
      value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${todayChangePercent >= 0 ? '+' : ''}${todayChangePercent.toFixed(2)}%`,
      isPositive: todayChangePercent >= 0,
      icon: DollarSign,
      gradient: "bg-gradient-primary",
    },
    {
      title: "Cash Balance",
      value: `$${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "Available",
      isPositive: true,
      icon: Wallet,
      gradient: "bg-blue-500",
    },
    {
      title: "Invested Value",
      value: `$${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${totalAssets} stocks`,
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
