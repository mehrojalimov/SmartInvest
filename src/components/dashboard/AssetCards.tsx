import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePortfolio } from "@/hooks/usePortfolio";

export const AssetCards = () => {
  const { data: portfolioData, isLoading, error } = usePortfolio();

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

  const assets = portfolioData?.portfolio || [];

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
          assets.map((asset, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-foreground">{asset.stock_name}</p>
                  <Badge variant="outline" className="text-xs">
                    Stock
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Shares: {asset.total_quantity}</p>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {asset.total_quantity} shares
                </p>
                <p className="text-xs text-muted-foreground">
                  In portfolio
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
