import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useStockData } from "@/hooks/usePortfolio";
import { useMemo, useState, useEffect } from "react";

export const PortfolioOverview = () => {
  const [cachedPrices, setCachedPrices] = useState<{[key: string]: any}>({});

  // Load cached prices from localStorage
  useEffect(() => {
    const savedPrices = localStorage.getItem('cachedStockPrices');
    if (savedPrices) {
      try {
        setCachedPrices(JSON.parse(savedPrices));
      } catch (e) {
        console.error('Failed to parse cached prices:', e);
      }
    }
  }, []);

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

  // Fetch real-time market data for accurate portfolio valuation
  const { data: marketData } = useQuery({
    queryKey: ['market-realtime-portfolio'],
    queryFn: async () => {
      const response = await fetch('/api/market/realtime');
      if (!response.ok) throw new Error('Failed to fetch market data');
      return response.json();
    },
    refetchInterval: 300000, // Update every 5 minutes for real prices
    onSuccess: (data) => {
      // Update cache with fresh data
      if (data) {
        setCachedPrices(prev => {
          const newCache = { ...prev, ...data };
          localStorage.setItem('cachedStockPrices', JSON.stringify(newCache));
          return newCache;
        });
      }
    }
  });

  const portfolio = portfolioData?.portfolio || [];
  const transactions = transactionsData?.transactions || [];
  const cashBalance = cashBalanceData?.cashBalance || 0;
  const costBasis = costBasisData?.costBasis || [];
  const totalAssets = portfolio.length;
  const totalTransactions = transactions.length;

  // Calculate current market value of stocks
  const currentMarketValue = useMemo(() => {
    return portfolio.reduce((total: number, asset: any) => {
      const stockData = marketData?.[asset.stock_name];
      const cachedData = cachedPrices[asset.stock_name];
      
      // Use fresh data if available, otherwise fall back to cached data
      const price = stockData?.price ? parseFloat(stockData.price) : 
                   (cachedData?.price ? parseFloat(cachedData.price) : 0);
      
      return total + (asset.total_quantity * price);
    }, 0);
  }, [portfolio, marketData, cachedPrices]);

  const totalValue = currentMarketValue + cashBalance;

  // Calculate total invested value (cost basis)
  const totalInvestedValue = useMemo(() => {
    const invested = costBasis.reduce((total: number, item: any) => {
      return total + item.cost_basis;
    }, 0);
    
    console.log('🔍 PORTFOLIO OVERVIEW DEBUG:');
    console.log('  Cost Basis Data:', costBasis);
    console.log('  Total Invested Value:', invested);
    
    return invested;
  }, [costBasis]);

  // Calculate portfolio value as: Invested Amount + Performance
  const performance = currentMarketValue - totalInvestedValue;
  const portfolioValue = totalInvestedValue + performance;
  
  // Calculate real change based on actual market data with fallback to cache
  const realChange = useMemo(() => {
    if (portfolio.length === 0) return { change: 0, changePercent: 0 };
    
    let totalChange = 0;
    let totalPreviousValue = 0;
    
    portfolio.forEach((asset: any) => {
      const stockData = marketData?.[asset.stock_name];
      const cachedData = cachedPrices[asset.stock_name];
      
      // Use fresh data if available, otherwise fall back to cached data
      const currentPrice = stockData?.price ? parseFloat(stockData.price) : 
                          (cachedData?.price ? parseFloat(cachedData.price) : 0);
      const change = stockData?.change ? parseFloat(stockData.change) : 
                    (cachedData?.change ? parseFloat(cachedData.change) : 0);
      
      if (currentPrice > 0 && change !== 0) {
        const previousPrice = currentPrice - change;
        totalChange += asset.total_quantity * change;
        totalPreviousValue += asset.total_quantity * previousPrice;
      }
    });
    
    const changePercent = totalPreviousValue > 0 ? (totalChange / totalPreviousValue) * 100 : 0;
    return { change: totalChange, changePercent };
  }, [portfolio, marketData, cachedPrices]);
  
  const todayChange = realChange.change;
  const todayChangePercent = realChange.changePercent;

  // Debug logging after all values are calculated
  useEffect(() => {
    console.log('🔍 COMPLETE PORTFOLIO OVERVIEW DEBUG:');
    console.log('  Portfolio Value (market):', portfolioValue);
    console.log('  Cash Balance:', cashBalance);
    console.log('  Total Value:', totalValue);
    console.log('  Total Invested Value:', totalInvestedValue);
    console.log('  Total Assets:', totalAssets);
    console.log('  Total Transactions:', totalTransactions);
  }, [portfolioValue, cashBalance, totalValue, totalInvestedValue, totalAssets, totalTransactions]);

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
      change: `${performance >= 0 ? '+' : ''}${(performance / totalInvestedValue * 100).toFixed(2)}%`,
      isPositive: performance >= 0,
      icon: TrendingUp,
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
