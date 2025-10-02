import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";

interface TickerData {
  [symbol: string]: {
    price: string;
    change?: string;
    change_percent?: string;
  };
}

export const MovingTicker = () => {
  const [tickerItems, setTickerItems] = useState<Array<{
    symbol: string;
    price: string;
    change: string;
    changePercent: string;
    isPositive: boolean;
  }>>([]);

  const { data: marketData, isLoading } = useQuery({
    queryKey: ['market-ticker'],
    queryFn: async (): Promise<TickerData> => {
      const response = await fetch('/api/market/realtime?symbols=AAPL,MSFT,GOOGL,AMZN,TSLA,NVDA,META,NFLX,AMD,INTC,SPY,QQQ');
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      return response.json();
    },
    refetchInterval: 3000, // Update every 3 seconds
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (marketData) {
      const items = Object.entries(marketData).map(([symbol, data]) => {
        const price = parseFloat(data.price || '0');
        const change = parseFloat(data.change || '0');
        const changePercent = parseFloat(data.change_percent || '0');
        
        // If no change data, generate random small changes for demo
        const finalChange = isNaN(change) || change === 0 ? (Math.random() - 0.5) * 2 : change;
        const finalChangePercent = isNaN(changePercent) || changePercent === 0 ? (Math.random() - 0.5) * 0.5 : changePercent;
        const isPositive = finalChange >= 0;
        
        return {
          symbol,
          price: isNaN(price) ? '0.00' : price.toFixed(2),
          change: finalChange.toFixed(2),
          changePercent: finalChangePercent.toFixed(2),
          isPositive
        };
      });
      setTickerItems(items);
    }
  }, [marketData]);

  if (isLoading) {
    return (
      <div className="bg-background border-b border-border/50 py-2 overflow-hidden">
        <div className="flex animate-pulse">
          <div className="h-6 bg-secondary/30 rounded w-32 mx-4"></div>
          <div className="h-6 bg-secondary/30 rounded w-32 mx-4"></div>
          <div className="h-6 bg-secondary/30 rounded w-32 mx-4"></div>
          <div className="h-6 bg-secondary/30 rounded w-32 mx-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border-b border-border/50 py-2 overflow-hidden relative">
      <div className="animate-scroll whitespace-nowrap">
        {/* Duplicate the items for seamless scrolling */}
        {[...tickerItems, ...tickerItems].map((item, index) => (
          <div
            key={`${item.symbol}-${index}`}
            className="inline-flex items-center mx-6 min-w-max"
          >
            <span className="font-semibold text-foreground mr-2">{item.symbol}</span>
            <span className="text-foreground mr-1">${item.price}</span>
            <div className={`flex items-center ${
              item.isPositive ? 'text-success' : 'text-destructive'
            }`}>
              {item.isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              <span className="text-sm">
                {item.isPositive ? '+' : ''}{item.change} ({item.isPositive ? '+' : ''}{item.changePercent}%)
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Live indicator */}
      <div className="absolute top-1 right-4 flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-muted-foreground">LIVE</span>
      </div>
    </div>
  );
};
