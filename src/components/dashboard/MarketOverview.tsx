import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";

// Extended S&P 500 stock list for rotation
const sp500Stocks = [
  // Technology
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "NFLX", name: "Netflix Inc." },
  { symbol: "ADBE", name: "Adobe Inc." },
  { symbol: "CRM", name: "Salesforce Inc." },
  { symbol: "ORCL", name: "Oracle Corp." },
  { symbol: "INTC", name: "Intel Corp." },
  { symbol: "AMD", name: "Advanced Micro Devices" },
  { symbol: "CSCO", name: "Cisco Systems Inc." },
  { symbol: "IBM", name: "International Business Machines" },
  
  // Financial
  { symbol: "JPM", name: "JPMorgan Chase & Co." },
  { symbol: "BAC", name: "Bank of America Corp." },
  { symbol: "WFC", name: "Wells Fargo & Company" },
  { symbol: "GS", name: "Goldman Sachs Group Inc." },
  { symbol: "V", name: "Visa Inc." },
  { symbol: "MA", name: "Mastercard Inc." },
  { symbol: "AXP", name: "American Express Co." },
  { symbol: "C", name: "Citigroup Inc." },
  
  // Healthcare
  { symbol: "JNJ", name: "Johnson & Johnson" },
  { symbol: "PFE", name: "Pfizer Inc." },
  { symbol: "UNH", name: "UnitedHealth Group Inc." },
  { symbol: "ABBV", name: "AbbVie Inc." },
  { symbol: "MRK", name: "Merck & Co. Inc." },
  { symbol: "TMO", name: "Thermo Fisher Scientific Inc." },
  { symbol: "ABT", name: "Abbott Laboratories" },
  { symbol: "DHR", name: "Danaher Corp." },
  
  // Consumer
  { symbol: "KO", name: "The Coca-Cola Company" },
  { symbol: "PEP", name: "PepsiCo Inc." },
  { symbol: "WMT", name: "Walmart Inc." },
  { symbol: "PG", name: "Procter & Gamble Co." },
  { symbol: "NKE", name: "Nike Inc." },
  { symbol: "MCD", name: "McDonald's Corp." },
  { symbol: "SBUX", name: "Starbucks Corp." },
  { symbol: "HD", name: "Home Depot Inc." },
  
  // Energy
  { symbol: "XOM", name: "Exxon Mobil Corporation" },
  { symbol: "CVX", name: "Chevron Corporation" },
  { symbol: "COP", name: "ConocoPhillips" },
  { symbol: "EOG", name: "EOG Resources Inc." },
  
  // Industrial
  { symbol: "BA", name: "The Boeing Company" },
  { symbol: "CAT", name: "Caterpillar Inc." },
  { symbol: "GE", name: "General Electric Company" },
  { symbol: "HON", name: "Honeywell International Inc." },
  { symbol: "UPS", name: "United Parcel Service Inc." },
  
  // Communication
  { symbol: "T", name: "AT&T Inc." },
  { symbol: "VZ", name: "Verizon Communications Inc." },
  { symbol: "DIS", name: "The Walt Disney Company" },
  { symbol: "CMCSA", name: "Comcast Corp." },
  
  // ETFs
  { symbol: "SPY", name: "SPDR S&P 500 ETF" },
  { symbol: "QQQ", name: "Invesco QQQ Trust" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF" }
];

export const MarketOverview = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cachedStocks, setCachedStocks] = useState<{[key: string]: any}>({});
  const [isRotating, setIsRotating] = useState(true);

  // Load cached stocks from localStorage
  useEffect(() => {
    const savedStocks = localStorage.getItem('cachedMarketStocks');
    if (savedStocks) {
      try {
        setCachedStocks(JSON.parse(savedStocks));
      } catch (e) {
        console.error('Failed to parse cached market stocks:', e);
      }
    }
  }, []);

  // Rotate through stocks every 15 seconds
  useEffect(() => {
    if (!isRotating) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 6) % sp500Stocks.length);
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [isRotating]);

  // Get current batch of 6 stocks to display
  const currentStocks = useMemo(() => {
    const batch = [];
    for (let i = 0; i < 6; i++) {
      const index = (currentIndex + i) % sp500Stocks.length;
      batch.push(sp500Stocks[index]);
    }
    return batch;
  }, [currentIndex]);

  // Fetch real-time data for current stocks
  const { data: marketData, isLoading, error } = useQuery({
    queryKey: ['market-realtime-overview', currentStocks.map(s => s.symbol).join(',')],
    queryFn: async () => {
      const symbols = currentStocks.map(s => s.symbol);
      const response = await fetch(`/api/market/realtime?symbols=${symbols.join(',')}`);
      if (!response.ok) throw new Error('Failed to fetch market data');
      return response.json();
    },
    refetchInterval: 30000, // Update every 30 seconds
    onSuccess: (data) => {
      // Update cache with fresh data
      if (data) {
        setCachedStocks(prev => {
          const newCache = { ...prev, ...data };
          localStorage.setItem('cachedMarketStocks', JSON.stringify(newCache));
          return newCache;
        });
      }
    }
  });

  // Prepare stocks data with fallback to cache
  const stocks = useMemo(() => {
    return currentStocks.map(stock => {
      const realTimeData = marketData?.[stock.symbol];
      const cachedData = cachedStocks[stock.symbol];
      
      // Use real-time data if available, otherwise fall back to cached data
      const price = realTimeData?.price ? parseFloat(realTimeData.price) : 
                   (cachedData?.price ? parseFloat(cachedData.price) : 0);
      const change = realTimeData?.change_percent ? parseFloat(realTimeData.change_percent) : 
                    (cachedData?.change_percent ? parseFloat(cachedData.change_percent) : 0);
      
      return {
        ...stock,
        price,
        change,
        isRealTimeData: !!realTimeData?.price,
        isCachedData: !realTimeData?.price && !!cachedData?.price
      };
    });
  }, [currentStocks, marketData, cachedStocks]);

  if (isLoading && Object.keys(cachedStocks).length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Market Overview
            <Badge variant="outline" className="text-xs">
              Loading...
            </Badge>
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

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Market Overview
          <Badge variant="outline" className="text-xs">
            S&P 500
          </Badge>
          <button
            onClick={() => setIsRotating(!isRotating)}
            className="ml-auto p-1 hover:bg-secondary rounded"
            title={isRotating ? "Pause rotation" : "Resume rotation"}
          >
            <RefreshCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
          </button>
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
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {stock.isRealTimeData ? 'Live data' : 
                       stock.isCachedData ? 'Cached data' : 'No data'}
                    </p>
                    {stock.isCachedData && (
                      <span className="text-xs text-blue-500">(cached)</span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {stock.price > 0 ? `$${stock.price.toFixed(2)}` : 'N/A'}
                  </p>
                  {stock.price > 0 && (
                    <div className={`flex items-center gap-1 text-sm ${
                      isPositive ? "text-success" : "text-destructive"
                    }`}>
                      <TrendIcon className="w-3 h-3" />
                      {isPositive ? '+' : ''}{stock.change.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            {isRotating ? 'Rotating every 15 seconds' : 'Rotation paused'} • 
            Showing {currentIndex + 1}-{Math.min(currentIndex + 6, sp500Stocks.length)} of {sp500Stocks.length} S&P 500 stocks
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
