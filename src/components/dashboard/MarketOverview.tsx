import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

const stockNames = {
  "AAPL": "Apple Inc.",
  "MSFT": "Microsoft Corp.",
  "TSLA": "Tesla Inc.",
  "NVDA": "NVIDIA Corp.",
  "GOOGL": "Alphabet Inc.",
  "AMZN": "Amazon.com Inc.",
  "META": "Meta Platforms Inc.",
  "NFLX": "Netflix Inc.",
  "AMD": "Advanced Micro Devices",
  "INTC": "Intel Corp.",
  "SPY": "SPDR S&P 500 ETF",
  "QQQ": "Invesco QQQ Trust"
};

export const MarketOverview = () => {
  const { data: marketData, isLoading, error } = useQuery({
    queryKey: ['market-realtime-overview'],
    queryFn: async () => {
      const response = await fetch('/api/market/realtime');
      if (!response.ok) throw new Error('Failed to fetch market data');
      return response.json();
    },
    refetchInterval: 300000, // Update every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-secondary rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-secondary rounded w-1/2"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-secondary rounded w-16 mb-1"></div>
                  <div className="h-3 bg-secondary rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !marketData) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Failed to load market data
          </p>
        </CardContent>
      </Card>
    );
  }

  const stocks = Object.entries(marketData).map(([symbol, data]) => ({
    symbol,
    name: stockNames[symbol] || symbol,
    price: parseFloat(data.price || '0'),
    change: parseFloat(data.change_percent || '0'),
    volume: "N/A" // Volume not available in current API
  }));

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Market Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stocks.map((stock) => {
            const isPositive = stock.change >= 0;
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;
            
            return (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{stock.symbol}</p>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Real-time data</p>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    ${stock.price.toFixed(2)}
                  </p>
                  <div className={`flex items-center gap-1 text-sm ${
                    isPositive ? "text-success" : "text-destructive"
                  }`}>
                    <TrendIcon className="w-3 h-3" />
                    {isPositive ? '+' : ''}{stock.change.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
