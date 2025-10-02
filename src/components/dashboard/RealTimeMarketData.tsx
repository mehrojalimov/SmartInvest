import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface MarketData {
  [symbol: string]: {
    price: string;
    change?: string;
    change_percent?: string;
    volume?: string;
  };
}

export const RealTimeMarketData = () => {
  const [isLive, setIsLive] = useState(true);
  
  const { data: marketData, isLoading, error, refetch } = useQuery({
    queryKey: ['market-realtime'],
    queryFn: async (): Promise<MarketData> => {
      const response = await fetch('/api/market/realtime?symbols=AAPL,MSFT,GOOGL,AMZN,TSLA,NVDA,META,NFLX,AMD,INTC');
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      return response.json();
    },
    refetchInterval: isLive ? 5000 : false, // Update every 5 seconds when live
    refetchOnWindowFocus: true,
  });

  // Auto-refresh indicator
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        refetch();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLive, refetch]);

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-Time Market Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-Time Market Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>Failed to load market data</p>
            <button 
              onClick={() => refetch()}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const marketDataArray = marketData ? Object.entries(marketData).map(([symbol, data]) => ({
    symbol,
    ...data
  })) : [];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-Time Market Data
            {isLive && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">LIVE</span>
              </div>
            )}
          </div>
          <button
            onClick={toggleLive}
            className="text-sm px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
          >
            {isLive ? 'Pause' : 'Resume'}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {marketDataArray.map((stock) => {
            const change = parseFloat(stock.change || '0');
            const changePercent = parseFloat(stock.change_percent || '0');
            const isPositive = change >= 0;
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;
            
            return (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{stock.symbol}</p>
                    <Badge variant="outline" className="text-xs">
                      {stock.volume ? `${(parseFloat(stock.volume) / 1000000).toFixed(1)}M` : 'N/A'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    ${parseFloat(stock.price).toFixed(2)}
                  </p>
                  <div className={`flex items-center gap-1 text-sm ${
                    isPositive ? "text-success" : "text-destructive"
                  }`}>
                    <TrendIcon className="w-3 h-3" />
                    {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <span>Data: 12 Data API</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
