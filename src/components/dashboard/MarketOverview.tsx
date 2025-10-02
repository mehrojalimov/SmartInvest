import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const marketData = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 177.30,
    change: 1.8,
    volume: "45.2M"
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 383.75,
    change: 2.1,
    volume: "28.1M"
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 249.50,
    change: -0.5,
    volume: "35.7M"
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    price: 429.75,
    change: 3.2,
    volume: "32.4M"
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 144.35,
    change: 0.8,
    volume: "18.9M"
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 157.25,
    change: 1.2,
    volume: "22.3M"
  }
];

export const MarketOverview = () => {
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
          {marketData.map((stock) => {
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
                  <p className="text-xs text-muted-foreground">Vol: {stock.volume}</p>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    ${stock.price.toFixed(2)}
                  </p>
                  <div className={`flex items-center gap-1 text-sm ${
                    isPositive ? "text-success" : "text-destructive"
                  }`}>
                    <TrendIcon className="w-3 h-3" />
                    {isPositive ? '+' : ''}{stock.change.toFixed(1)}%
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
