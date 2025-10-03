import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ExternalLink, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface StockDetailsModalProps {
  open: boolean;
  onClose: () => void;
  symbol: string;
  quantity: number;
  costBasis: number;
}

export const StockDetailsModal = ({ open, onClose, symbol, quantity, costBasis }: StockDetailsModalProps) => {
  // Fetch stock data
  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock-details', symbol],
    queryFn: async () => {
      const response = await fetch(`/api/stock/${symbol}`);
      if (!response.ok) throw new Error('Failed to fetch stock data');
      return response.json();
    },
    enabled: open && !!symbol,
  });

  if (!open) return null;

  const currentPrice = stockData ? parseFloat(stockData.price) : 0;
  const marketValue = currentPrice * quantity;
  const profitLoss = marketValue - costBasis;
  const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
  const isPositive = profitLoss >= 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {symbol} - Stock Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : stockData ? (
          <div className="space-y-6">
            {/* Current Position Summary */}
            <div className="p-4 rounded-lg bg-secondary/50">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                Your Position
                <a
                  href={`https://finance.yahoo.com/quote/${symbol}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors ml-auto"
                  title="View on Yahoo Finance"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Shares Owned</p>
                  <p className="font-bold text-lg">{quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="font-bold text-lg">${currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Market Value</p>
                  <p className="font-bold text-lg">${marketValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">P&L</p>
                  <div className="flex items-center gap-1">
                    {isPositive ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                    <p className={`font-bold text-lg ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {isPositive ? '+' : ''}${profitLoss.toFixed(2)}
                    </p>
                  </div>
                  <p className={`text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
                    {isPositive ? '+' : ''}{profitLossPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            <div className="p-4 rounded-lg bg-secondary/50">
              <h3 className="font-semibold mb-3">Market Data</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="font-semibold">${parseFloat(stockData.open || '0').toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">High</p>
                  <p className="font-semibold text-success">${parseFloat(stockData.high || '0').toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low</p>
                  <p className="font-semibold text-destructive">${parseFloat(stockData.low || '0').toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="font-semibold">{parseInt(stockData.volume || '0').toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Cost</p>
                  <p className="font-semibold">${(costBasis / quantity).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="font-semibold text-sm">{stockData.time}</p>
                </div>
              </div>
            </div>

            {/* Investment Summary */}
            <div className="p-4 rounded-lg bg-secondary/50">
              <h3 className="font-semibold mb-3">Investment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Invested (Cost Basis)</span>
                  <span className="font-semibold">${costBasis.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Market Value</span>
                  <span className="font-semibold">${marketValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Unrealized Gain/Loss</span>
                  <div className="text-right">
                    <div className={`font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {isPositive ? '+' : ''}${profitLoss.toFixed(2)}
                    </div>
                    <Badge variant={isPositive ? "success" : "destructive"} className="text-xs">
                      {isPositive ? '+' : ''}{profitLossPercent.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`https://finance.yahoo.com/quote/${symbol}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Yahoo Finance
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`https://finance.yahoo.com/quote/${symbol}/chart`, '_blank')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Charts
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Failed to load stock data
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

