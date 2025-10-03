import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export const PerformanceChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("6M");

  const { data: portfolioData } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }
      return response.json();
    },
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
  });

  const portfolio = portfolioData?.portfolio || [];
  const transactions = transactionsData?.transactions || [];

  // Fetch individual stock prices for portfolio holdings
  const { data: portfolioStockPrices } = useQuery({
    queryKey: ['chart-stock-prices', portfolio.map((p: any) => p.stock_name).join(',')],
    queryFn: async () => {
      if (portfolio.length === 0) return {};
      
      const prices: {[key: string]: number} = {};
      await Promise.all(
        portfolio.map(async (asset: any) => {
          try {
            const response = await fetch(`/api/stock/${asset.stock_name}`);
            if (response.ok) {
              const data = await response.json();
              prices[asset.stock_name] = parseFloat(data.price);
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

  // Calculate current portfolio value using real stock prices
  const currentPortfolioValue = useMemo(() => {
    if (portfolio.length === 0) return 0;
    
    return portfolio.reduce((total: number, asset: any) => {
      // Get last transaction price as fallback
      const lastTransaction = transactions.find(
        (t: any) => t.stock_name === asset.stock_name
      );
      const transactionPrice = lastTransaction?.price ? parseFloat(lastTransaction.price) : 0;
      
      // Use fetched price or fall back to transaction price
      const price = portfolioStockPrices?.[asset.stock_name] || transactionPrice;
      
      return total + (asset.total_quantity * price);
    }, 0);
  }, [portfolio, portfolioStockPrices, transactions]);

  // Generate historical data based on PORTFOLIO PERFORMANCE ONLY (not cash)
  const generateHistoricalData = (period: string) => {
    const months = period === "1M" ? 1 : period === "3M" ? 3 : period === "6M" ? 6 : period === "1Y" ? 12 : 12;
    const data = [];
    
    // If no portfolio value yet, show flat line at 0
    if (currentPortfolioValue === 0) {
      for (let i = months; i >= 0; i--) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentMonth = new Date().getMonth();
        const monthIndex = (currentMonth - i + 12) % 12;
        
        data.push({
          month: monthNames[monthIndex],
          value: 0 // Show 0 if no investments
        });
      }
      return data;
    }
    
    // Show portfolio growth from 0 to current portfolio value
    for (let i = months; i >= 0; i--) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonth = new Date().getMonth();
      const monthIndex = (currentMonth - i + 12) % 12;
      
      // Simulate growth from 0 to current portfolio value
      const progress = (months - i) / months;
      const value = currentPortfolioValue * progress;
      
      data.push({
        month: monthNames[monthIndex],
        value: value
      });
    }
    
    return data;
  };

  const data = useMemo(() => {
    return generateHistoricalData(selectedPeriod);
  }, [selectedPeriod, currentPortfolioValue]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Portfolio Performance</CardTitle>
          <div className="flex gap-2">
            {["1M", "3M", "6M", "1Y", "ALL"].map((period) => (
              <Button
                key={period}
                variant={period === selectedPeriod ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => handlePeriodChange(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Portfolio Value"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
