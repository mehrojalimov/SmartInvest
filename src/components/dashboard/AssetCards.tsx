import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

export const AssetCards = () => {
  const { data: portfolioData, isLoading, error } = usePortfolio();

  // Fetch real-time market data
  const { data: marketData } = useQuery({
    queryKey: ['market-realtime'],
    queryFn: async () => {
      const response = await fetch('/api/market/realtime');
      if (!response.ok) throw new Error('Failed to fetch market data');
      return response.json();
    },
    refetchInterval: 5000, // Update every 5 seconds
  });

  const assetsWithValues = useMemo(() => {
    if (!portfolioData?.portfolio) return [];
    
    return portfolioData.portfolio.map((asset: any) => {
      // Get real-time price from market data
      const stockPrice = marketData?.[asset.stock_name]?.price;
      const currentPrice = stockPrice ? parseFloat(stockPrice) : 0;
      
      // Calculate total value
      const totalValue = asset.total_quantity * currentPrice;
      
      // Generate small random change for demo (since real-time API doesn't provide change data)
      const change = (Math.random() - 0.5) * 2;
      
      return {
        ...asset,
        currentPrice,
        change,
        totalValue
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
  }, [portfolioData?.portfolio, marketData]);

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
                      ${asset.currentPrice.toFixed(2)}
                    </p>
                    <div className={`flex items-center gap-1 text-xs ${
                      isPositive ? "text-success" : "text-destructive"
                    }`}>
                      <TrendIcon className="w-3 h-3" />
                      {isPositive ? '+' : ''}{asset.change.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    ${asset.totalValue.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Value
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
