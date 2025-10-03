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
  
  const [basePrices, setBasePrices] = useState<Record<string, number>>({});

  const { data: marketData, isLoading } = useQuery({
    queryKey: ['market-ticker'],
    queryFn: async (): Promise<TickerData> => {
      const response = await fetch('/api/market/realtime?symbols=AAPL,MSFT,GOOGL,AMZN,TSLA,NVDA,META,NFLX,AMD,INTC,SPY,QQQ');
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      return response.json();
    },
    refetchInterval: 300000, // Update every 5 minutes (300000ms) for real prices
    refetchOnWindowFocus: false, // Don't refetch on focus
  });

  useEffect(() => {
    if (marketData) {
      const items = Object.entries(marketData).map(([symbol, data]) => {
        const price = parseFloat(data.price || '0');
        const change = parseFloat(data.change || '0');
        const changePercent = parseFloat(data.change_percent || '0');
        
        // Use real API data if available
        if (price > 0) {
          return {
            symbol,
            price: price.toFixed(2),
            change: change.toFixed(2),
            changePercent: changePercent.toFixed(2),
            isPositive: change >= 0
          };
        }
        
        // Fallback to base price with small changes if API data is invalid
        const basePrice = basePrices[symbol] || price;
        if (basePrice > 0) {
          const changeAmount = (Math.random() - 0.5) * (basePrice * 0.01); // Max 1% change
          const currentPrice = basePrice + changeAmount;
          const changePercent = (changeAmount / basePrice) * 100;
          
          return {
            symbol,
            price: currentPrice.toFixed(2),
            change: changeAmount.toFixed(2),
            changePercent: changePercent.toFixed(2),
            isPositive: changeAmount >= 0
          };
        }
        
        return null;
      }).filter(Boolean);
      
      setTickerItems(items);
    }
  }, [marketData, basePrices]);

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
