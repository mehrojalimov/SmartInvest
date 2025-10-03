import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useStockData, useAddTransaction } from "@/hooks/usePortfolio";

export const StockSearch = () => {
  const [symbol, setSymbol] = useState("");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [transactionType, setTransactionType] = useState<"BUY" | "SELL">("BUY");

  const { data: stockData, isLoading, error } = useStockData(searchSymbol);
  const addTransaction = useAddTransaction();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      // Only search when form is submitted
      setSearchSymbol(symbol.toUpperCase());
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockData || !quantity) return;

    try {
      await addTransaction.mutateAsync({
        stock_name: stockData.symbol,
        transaction_type: transactionType,
        quantity: parseInt(quantity),
      });
      
      setQuantity("");
      alert(`${transactionType} transaction successful!`);
    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction failed. Please try again.");
    }
  };

  // Calculate real change data from API
  const changeAmount = stockData ? parseFloat(stockData.change || '0') : 0;
  const changePercent = stockData ? parseFloat(stockData.change_percent || '0') : 0;
  const isPositive = changeAmount >= 0;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Stock Search & Trade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Enter stock symbol (e.g., AAPL)"
            className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" disabled={!symbol.trim()}>
            Search
          </Button>
        </form>

        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        
        {error && (
          <p className="text-sm text-destructive">
            Error: {error.message}
          </p>
        )}

        {stockData && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{stockData.symbol}</h3>
                <div className="text-right">
                  <Badge variant={isPositive ? "success" : "destructive"}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {isPositive ? "+" : ""}
                    {changePercent.toFixed(2)}%
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isPositive ? "+" : ""}${changeAmount.toFixed(2)} today
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Current Price</p>
                  <p className="font-semibold text-lg">${parseFloat(stockData.price).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Volume</p>
                  <p className="font-semibold">{parseInt(stockData.volume).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">High (24h)</p>
                  <p className="font-semibold">${parseFloat(stockData.high).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Low (24h)</p>
                  <p className="font-semibold">${parseFloat(stockData.low).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-semibold">{stockData.time}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Symbol</p>
                  <p className="font-semibold">{stockData.symbol}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleTransaction} className="space-y-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={transactionType === "BUY" ? "default" : "outline"}
                  onClick={() => setTransactionType("BUY")}
                  className="flex-1"
                >
                  Buy
                </Button>
                <Button
                  type="button"
                  variant={transactionType === "SELL" ? "default" : "outline"}
                  onClick={() => setTransactionType("SELL")}
                  className="flex-1"
                >
                  Sell
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Quantity"
                    min="1"
                    className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button 
                    type="submit" 
                    disabled={!quantity || addTransaction.isPending}
                    className="px-6"
                  >
                    {addTransaction.isPending ? "Processing..." : transactionType}
                  </Button>
                </div>
                {quantity && (
                  <div className="text-sm text-muted-foreground">
                    Total: ${(parseFloat(quantity) * parseFloat(stockData.price)).toFixed(2)} 
                    @ ${parseFloat(stockData.price).toFixed(2)} per share
                  </div>
                )}
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
