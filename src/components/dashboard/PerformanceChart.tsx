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

  const { data: cashBalanceData } = useQuery({
    queryKey: ['cashBalance'],
    queryFn: async () => {
      const response = await fetch('/api/cash-balance', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cash balance');
      }
      return response.json();
    },
  });

  // Mock prices for calculation
  const mockPrices: { [key: string]: number } = {
    'AAPL': 177.30,
    'MSFT': 383.75,
    'TSLA': 249.50,
    'AMZN': 157.25,
    'GOOGL': 144.35,
    'NVDA': 429.75,
    'META': 323.45,
    'NFLX': 488.75,
    'AMD': 127.20,
    'INTC': 43.25
  };

  const currentPortfolioValue = useMemo(() => {
    if (!portfolioData?.portfolio) return 0;
    return portfolioData.portfolio.reduce((total: number, asset: any) => {
      const price = mockPrices[asset.stock_name] || 0;
      return total + (asset.total_quantity * price);
    }, 0);
  }, [portfolioData?.portfolio]);

  const cashBalance = cashBalanceData?.cashBalance || 0;
  const currentTotalValue = currentPortfolioValue + cashBalance;

  // Generate historical data based on current portfolio
  const generateHistoricalData = (period: string) => {
    const months = period === "1M" ? 1 : period === "3M" ? 3 : period === "6M" ? 6 : period === "1Y" ? 12 : 12;
    const data = [];
    const baseValue = 10000; // Starting with $10,000
    const currentValue = currentTotalValue;
    
    for (let i = months; i >= 0; i--) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonth = new Date().getMonth();
      const monthIndex = (currentMonth - i + 12) % 12;
      
      // Simulate growth from base value to current value
      const progress = (months - i) / months;
      const value = baseValue + (currentValue - baseValue) * progress;
      
      data.push({
        month: monthNames[monthIndex],
        value: Math.max(value, baseValue * 0.8) // Ensure minimum value
      });
    }
    
    return data;
  };

  const data = useMemo(() => {
    return generateHistoricalData(selectedPeriod);
  }, [selectedPeriod, currentTotalValue]);

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
