import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export const AssetCards = () => {
  const { data: portfolioData, isLoading, error } = usePortfolio();
  const [cachedPrices, setCachedPrices] = useState<{[key: string]: any}>({});

  // Fetch transaction history for fallback prices
  const { data: transactionsData } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });

  // Fetch cost basis (total amount invested) for each stock
  const { data: costBasisData } = useQuery({
    queryKey: ['costBasis'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/cost-basis', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch cost basis');
      return response.json();
    },
  });

  // Load cached prices from localStorage on component mount
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

  // Fetch real-time market data
  const { data: marketData } = useQuery({
    queryKey: ['market-realtime'],
    queryFn: async () => {
      const response = await fetch('/api/market/realtime');
      if (!response.ok) throw new Error('Failed to fetch market data');
      return response.json();
    },
    refetchInterval: 300000, // Update every 5 minutes (300000ms) for real prices
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

  const assetsWithValues = useMemo(() => {
    if (!portfolioData?.portfolio) return [];
    
    return portfolioData.portfolio.map((asset: any) => {
      // Get real-time price and change data from market data
      const stockData = marketData?.[asset.stock_name];
      const cachedData = cachedPrices[asset.stock_name];
      
      // Get last transaction price as final fallback
      const lastTransaction = transactionsData?.transactions?.find(
        (t: any) => t.stock_name === asset.stock_name
      );
      const transactionPrice = lastTransaction?.price ? parseFloat(lastTransaction.price) : 0;
      
      // Get cost basis (total amount invested) for this stock
      const costBasis = costBasisData?.costBasis?.find(
        (cb: any) => cb.stock_name === asset.stock_name
      )?.cost_basis || 0;
      
      // Use fresh data if available, otherwise fall back to cached data, then transaction price
      const currentPrice = stockData?.price ? parseFloat(stockData.price) : 
                          (cachedData?.price ? parseFloat(cachedData.price) : transactionPrice);
      
      // For change calculation, only use real-time or cached data (not transaction data)
      // Transaction data doesn't have meaningful change information
      const change = stockData?.change ? parseFloat(stockData.change) : 
                    (cachedData?.change ? parseFloat(cachedData.change) : 0);
      const changePercent = stockData?.change_percent ? parseFloat(stockData.change_percent) : 
                           (cachedData?.change_percent ? parseFloat(cachedData.change_percent) : 0);
      
      // Determine data source for proper labeling
      const isRealTimeData = !!stockData?.price;
      const isCachedData = !isRealTimeData && !!cachedData?.price;
      const isTransactionData = !isRealTimeData && !isCachedData && transactionPrice > 0;
      
      // Calculate total value and profit/loss
      const totalValue = asset.total_quantity * currentPrice;
      const profitLoss = totalValue - costBasis;
      const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
      
      return {
        ...asset,
        currentPrice,
        change: changePercent,
        totalValue,
        costBasis,
        profitLoss,
        profitLossPercent,
        isPriceAvailable: currentPrice > 0,
        isRealTimeData,
        isCachedData,
        isTransactionData
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
  }, [portfolioData?.portfolio, marketData, cachedPrices, transactionsData, costBasisData]);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Top Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading assets...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Top Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Error loading assets</p>
        </CardContent>
      </Card>
    );
  }

  const assets = assetsWithValues;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Portfolio Assets</span>
          <Badge variant="secondary" className="text-xs">
            {assets.length} assets
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No assets in portfolio yet. Start by searching and buying stocks!
          </p>
        ) : (
          assets.map((asset, index) => {
            const isPositive = asset.change >= 0;
            const TrendIcon = isPositive ? TrendingUp : TrendingDown;
            
            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{asset.stock_name}</p>
                    <Badge variant="outline" className="text-xs">
                      {asset.total_quantity} shares
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {asset.isPriceAvailable ? `$${asset.currentPrice.toFixed(2)}` : 'Price unavailable'}
                      {asset.isPriceAvailable && !asset.isRealTimeData && asset.isCachedData && (
                        <span className="text-xs text-blue-500 ml-1">(cached)</span>
                      )}
                      {asset.isPriceAvailable && !asset.isRealTimeData && asset.isTransactionData && (
                        <span className="text-xs text-orange-500 ml-1">(last trade)</span>
                      )}
                    </p>
                    {asset.isPriceAvailable && (asset.isRealTimeData || asset.isCachedData) && (
                      <div className={`flex items-center gap-1 text-xs ${
                        isPositive ? "text-success" : "text-destructive"
                      }`}>
                        <TrendIcon className="w-3 h-3" />
                        {isPositive ? '+' : ''}{asset.change.toFixed(1)}%
                      </div>
                    )}
                    {asset.isTransactionData && (
                      <div className="text-xs text-muted-foreground">
                        No change data
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {asset.isPriceAvailable ? 
                      `$${asset.totalValue.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}` : 
                      'Unavailable'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Value
                  </p>
                  {asset.costBasis > 0 && (
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground">
                        Invested: ${asset.costBasis.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </p>
                      <p className={`text-xs font-medium ${
                        asset.profitLoss >= 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {asset.profitLoss >= 0 ? '+' : ''}${asset.profitLoss.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })} ({asset.profitLoss >= 0 ? '+' : ''}{asset.profitLossPercent.toFixed(1)}%)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
