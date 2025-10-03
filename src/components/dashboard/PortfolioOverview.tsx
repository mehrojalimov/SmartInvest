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

  // Fetch real-time market data for accurate portfolio valuation
  const { data: marketData } = useQuery({
    queryKey: ['market-realtime-portfolio'],
    queryFn: async () => {
      const response = await fetch('/api/market/realtime');
      if (!response.ok) throw new Error('Failed to fetch market data');
      return response.json();
    },
    refetchInterval: 300000, // Update every 5 minutes for real prices
  });

  const portfolio = portfolioData?.portfolio || [];
  const transactions = transactionsData?.transactions || [];
  const cashBalance = cashBalanceData?.cashBalance || 0;
  const totalAssets = portfolio.length;
  const totalTransactions = transactions.length;

  // Calculate portfolio value using REAL API prices
  const portfolioValue = useMemo(() => {
    return portfolio.reduce((total: number, asset: any) => {
      const stockData = marketData?.[asset.stock_name];
      const price = stockData?.price ? parseFloat(stockData.price) : 0;
      return total + (asset.total_quantity * price);
    }, 0);
  }, [portfolio, marketData]);

  const totalValue = portfolioValue + cashBalance;
  
  // Calculate real change based on actual market data
  const realChange = useMemo(() => {
    if (!marketData || portfolio.length === 0) return { change: 0, changePercent: 0 };
    
    let totalChange = 0;
    let totalPreviousValue = 0;
    
    portfolio.forEach((asset: any) => {
      const stockData = marketData[asset.stock_name];
      if (stockData?.price && stockData?.change) {
        const currentPrice = parseFloat(stockData.price);
        const change = parseFloat(stockData.change);
        const previousPrice = currentPrice - change;
        
        totalChange += asset.total_quantity * change;
        totalPreviousValue += asset.total_quantity * previousPrice;
      }
    });
    
    const changePercent = totalPreviousValue > 0 ? (totalChange / totalPreviousValue) * 100 : 0;
    return { change: totalChange, changePercent };
  }, [portfolio, marketData]);
  
  const todayChange = realChange.change;
  const todayChangePercent = realChange.changePercent;

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
