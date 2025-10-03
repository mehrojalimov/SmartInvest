import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StockDetailsModal } from "./StockDetailsModal";

export const AssetCards = () => {
  const { data: portfolioData, isLoading, error } = usePortfolio();
  const [selectedStock, setSelectedStock] = useState<{
    symbol: string;
    quantity: number;
    costBasis: number;
  } | null>(null);

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

  const portfolio = portfolioData?.portfolio || [];

  // Fetch individual stock prices for portfolio holdings
  const { data: portfolioStockPrices } = useQuery({
    queryKey: ['asset-cards-stock-prices', portfolio.map((p: any) => p.stock_name).join(',')],
    queryFn: async () => {
      if (portfolio.length === 0) return {};
      
      const prices: {[key: string]: {price: number, change?: number, change_percent?: number}} = {};
      await Promise.all(
        portfolio.map(async (asset: any) => {
          try {
            const response = await fetch(`/api/stock/${asset.stock_name}`);
            if (response.ok) {
              const data = await response.json();
              prices[asset.stock_name] = {
                price: parseFloat(data.price),
                // Note: /api/stock doesn't return change data, would need enhancement
              };
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

  const assetsWithValues = useMemo(() => {
    if (!portfolioData?.portfolio) return [];
    
    return portfolioData.portfolio.map((asset: any) => {
      // Get last transaction price as fallback
      const lastTransaction = transactionsData?.transactions?.find(
        (t: any) => t.stock_name === asset.stock_name
      );
      const transactionPrice = lastTransaction?.price ? parseFloat(lastTransaction.price) : 0;
      
      // Get cost basis (total amount invested) for this stock
      const costBasis = costBasisData?.costBasis?.find(
        (cb: any) => cb.stock_name === asset.stock_name
      )?.cost_basis || 0;
      
      // Use fetched price or fall back to transaction price
      const stockPriceData = portfolioStockPrices?.[asset.stock_name];
      const currentPrice = stockPriceData?.price || transactionPrice;
      const changePercent = stockPriceData?.change_percent || 0;
      
      // Determine data source for proper labeling
      const isRealTimeData = !!stockPriceData?.price;
      const isTransactionData = !isRealTimeData && transactionPrice > 0;
      
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
        isTransactionData
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
  }, [portfolioData?.portfolio, portfolioStockPrices, transactionsData, costBasisData]);

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
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                onClick={() => setSelectedStock({
                  symbol: asset.stock_name,
                  quantity: asset.total_quantity,
                  costBasis: asset.costBasis
                })}
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

      {/* Stock Details Modal */}
      {selectedStock && (
        <StockDetailsModal
          open={!!selectedStock}
          onClose={() => setSelectedStock(null)}
          symbol={selectedStock.symbol}
          quantity={selectedStock.quantity}
          costBasis={selectedStock.costBasis}
        />
      )}
    </Card>
  );
};
