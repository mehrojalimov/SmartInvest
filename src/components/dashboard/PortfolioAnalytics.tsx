import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, PieChart, BarChart3, Target, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface PortfolioAnalytics {
  totalValue: number;
  totalCost: number;
  cashBalance: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  totalReturn: number;
  assetAllocation: {
    [symbol: string]: {
      quantity: number;
      currentPrice: number;
      marketValue: number;
      allocation: number;
    };
  };
  portfolioDiversification: number;
  riskMetrics: {
    concentration: number;
    diversification: number;
  };
}

export const PortfolioAnalytics = () => {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['portfolio-analytics'],
    queryFn: async (): Promise<PortfolioAnalytics> => {
      const response = await fetch('/api/portfolio/analytics', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio analytics');
      }
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const riskLevel = useMemo(() => {
    if (!analytics) return 'Low';
    const concentration = analytics.riskMetrics.concentration;
    if (concentration > 50) return 'High';
    if (concentration > 30) return 'Medium';
    return 'Low';
  }, [analytics]);

  const riskColor = useMemo(() => {
    switch (riskLevel) {
      case 'High': return 'text-destructive';
      case 'Medium': return 'text-yellow-500';
      default: return 'text-success';
    }
  }, [riskLevel]);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Portfolio Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Portfolio Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>Failed to load analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Portfolio Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">{formatCurrency(analytics.totalValue)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Return</p>
              <p className={`text-2xl font-bold ${analytics.totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPercentage(analytics.totalReturn)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Realized P&L</p>
              <p className={`text-lg font-semibold ${analytics.realizedPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(analytics.realizedPnL)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Unrealized P&L</p>
              <p className={`text-lg font-semibold ${analytics.unrealizedPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(analytics.unrealizedPnL)}
              </p>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Risk Analysis
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Risk Level</p>
                <Badge variant={riskLevel === 'High' ? 'destructive' : riskLevel === 'Medium' ? 'secondary' : 'default'}>
                  {riskLevel}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Diversification</p>
                <p className="font-semibold">{analytics.portfolioDiversification} assets</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Max Concentration</p>
                <p className={`font-semibold ${riskColor}`}>
                  {analytics.riskMetrics.concentration.toFixed(1)}%
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Cash Allocation</p>
                <p className="font-semibold">
                  {((analytics.cashBalance / analytics.totalValue) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Asset Allocation */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Asset Allocation
            </h4>
            <div className="space-y-2">
              {Object.entries(analytics.assetAllocation)
                .sort(([,a], [,b]) => b.allocation - a.allocation)
                .map(([symbol, allocation]) => (
                <div key={symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{symbol}</span>
                    <Badge variant="outline" className="text-xs">
                      {allocation.quantity} shares
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(allocation.marketValue)}</p>
                    <p className="text-sm text-muted-foreground">
                      {allocation.allocation.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Target className="w-4 h-4" />
              Performance Summary
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                <span className="text-sm">Cost Basis</span>
                <span className="font-semibold">{formatCurrency(analytics.totalCost)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                <span className="text-sm">Current Value</span>
                <span className="font-semibold">{formatCurrency(analytics.totalValue)}</span>
              </div>
              <div className={`flex justify-between items-center p-3 rounded-lg ${
                analytics.totalPnL >= 0 ? 'bg-success/10' : 'bg-destructive/10'
              }`}>
                <span className="text-sm">Total P&L</span>
                <span className={`font-semibold ${analytics.totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(analytics.totalPnL)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
