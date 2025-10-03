import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Wallet, LineChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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

  const transactions = transactionsData?.transactions || [];

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

  const { data: costBasisData } = useQuery({
    queryKey: ['costBasis'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/cost-basis', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cost basis');
      }
      return response.json();
    },
  });

  const portfolio = portfolioData?.portfolio || [];
  const cashBalance = cashBalanceData?.cashBalance || 0;
  const costBasis = costBasisData?.costBasis || [];
  const totalAssets = portfolio.length;
  const totalTransactions = transactions.length;

  // Fetch individual stock prices for portfolio holdings using the same endpoint as stock search
  const { data: portfolioStockPrices } = useQuery({
    queryKey: ['portfolio-stock-prices', portfolio.map((p: any) => p.stock_name).join(',')],
    queryFn: async () => {
      if (portfolio.length === 0) return {};
      
      const prices: {[key: string]: number} = {};
      await Promise.all(
        portfolio.map(async (asset: any) => {
          try {
            const response = await fetch(`/api/stock/${asset.stock_name}`);
            if (response.ok) {
              const data = await response.json();
              prices[asset.stock_name] = parseFloat(data.price);
            }
          } catch (error) {
            console.error(`Failed to fetch price for ${asset.stock_name}:`, error);
          }
        })
      );
      return prices;
    },
    enabled: portfolio.length > 0,
    refetchInterval: 300000, // Update every 5 minutes
  });

  // Calculate current market value of stocks
  const currentMarketValue = useMemo(() => {
    return portfolio.reduce((total: number, asset: any) => {
      // Get last transaction price as fallback
      const lastTransaction = transactions.find(
        (t: any) => t.stock_name === asset.stock_name
      );
      const transactionPrice = lastTransaction?.price ? parseFloat(lastTransaction.price) : 0;
      
      // Use fetched price or fall back to transaction price
      const price = portfolioStockPrices?.[asset.stock_name] || transactionPrice;
      
      return total + (asset.total_quantity * price);
    }, 0);
  }, [portfolio, portfolioStockPrices, transactions]);

  const totalValue = currentMarketValue + cashBalance;

  // Calculate total invested value (cost basis)
  const totalInvestedValue = useMemo(() => {
    return costBasis.reduce((total: number, item: any) => {
      return total + item.cost_basis;
    }, 0);
  }, [costBasis]);

  // Calculate portfolio value as: Invested Amount + Performance
  const performance = currentMarketValue - totalInvestedValue;
  const portfolioValue = totalInvestedValue + performance;
  
  // Calculate today's change as a simple percentage for now
  // TODO: Implement proper daily change tracking
  const todayChange = 0;
  const todayChangePercent = 0;

  // Calculate performance percentage with proper zero handling
  const performancePercent = totalInvestedValue > 0 
    ? (performance / totalInvestedValue * 100) 
    : 0;

  const stats = [
    {
      title: "Total Account Value",
      value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${todayChangePercent >= 0 ? '+' : ''}${todayChangePercent.toFixed(2)}%`,
      isPositive: todayChangePercent >= 0,
      icon: DollarSign,
      gradient: "bg-gradient-primary",
    },
    {
      title: "Portfolio Value",
      value: `$${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${performancePercent >= 0 ? '+' : ''}${performancePercent.toFixed(2)}%`,
      isPositive: performancePercent >= 0,
      icon: LineChart,
      gradient: "bg-gradient-secondary",
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
      value: `$${totalInvestedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
