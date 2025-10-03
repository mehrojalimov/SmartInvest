import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Search, Filter, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface ScreenerCriteria {
  minPrice?: string;
  maxPrice?: string;
  min_volume?: string;
  max_volume?: string;
  min_market_cap?: string;
  max_market_cap?: string;
  sector?: string;
  industry?: string;
}

interface ScreenerResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  market_cap: number;
  sector: string;
  industry: string;
  rsi?: number;
  pe_ratio?: number;
}

export const StockScreener = () => {
  const [criteria, setCriteria] = useState<ScreenerCriteria>({});
  const [isSearching, setIsSearching] = useState(false);

  const { data: screenerData, isLoading, error, refetch } = useQuery({
    queryKey: ['stock-screener', criteria],
    queryFn: async (): Promise<{ data: ScreenerResult[] }> => {
      const params = new URLSearchParams();
      Object.entries(criteria).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/screener?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch screener data');
      }
      return response.json();
    },
    enabled: false, // Only run when manually triggered
  });

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      await refetch();
    } finally {
      setIsSearching(false);
    }
  };

  const handleCriteriaChange = (key: keyof ScreenerCriteria, value: string) => {
    setCriteria(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const sectors = [
    'Technology', 'Healthcare', 'Financial Services', 'Consumer Discretionary',
    'Consumer Staples', 'Energy', 'Industrials', 'Materials', 'Real Estate',
    'Utilities', 'Communication Services'
  ];

  const industries = [
    'Software', 'Semiconductors', 'Biotechnology', 'Banks', 'Retail',
    'Automotive', 'Airlines', 'Oil & Gas', 'Telecommunications', 'Media'
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Algorithmic Stock Screener
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Criteria */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-price">Min Price ($)</Label>
              <Input
                id="min-price"
                type="number"
                placeholder="e.g., 10"
                value={criteria.minPrice || ''}
                onChange={(e) => handleCriteriaChange('minPrice', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-price">Max Price ($)</Label>
              <Input
                id="max-price"
                type="number"
                placeholder="e.g., 500"
                value={criteria.maxPrice || ''}
                onChange={(e) => handleCriteriaChange('maxPrice', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-volume">Min Volume (M)</Label>
              <Input
                id="min-volume"
                type="number"
                placeholder="e.g., 1"
                value={criteria.min_volume || ''}
                onChange={(e) => handleCriteriaChange('min_volume', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-volume">Max Volume (M)</Label>
              <Input
                id="max-volume"
                type="number"
                placeholder="e.g., 100"
                value={criteria.max_volume || ''}
                onChange={(e) => handleCriteriaChange('max_volume', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Select onValueChange={(value) => handleCriteriaChange('sector', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select onValueChange={(value) => handleCriteriaChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || isLoading}
            className="w-full"
          >
            <Search className="w-4 h-4 mr-2" />
            {isSearching ? 'Screening...' : 'Run Algorithmic Screen'}
          </Button>
        </div>

        {/* Results */}
        {error && (
          <div className="text-center text-destructive py-4">
            <p>Failed to load screener data</p>
            <Button variant="outline" size="sm" onClick={handleSearch} className="mt-2">
              Retry
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Analyzing market data...</p>
          </div>
        )}

        {screenerData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Screener Results</h3>
              <Badge variant="outline">
                {screenerData.data?.length || 0} stocks found
              </Badge>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {screenerData.data?.map((stock) => {
                // Add safe defaults for all numeric values
                const price = parseFloat(stock.price) || 0;
                const change = parseFloat(stock.change) || 0;
                const changePercent = parseFloat(stock.change_percent) || 0;
                const volume = parseFloat(stock.volume) || 0;
                const marketCap = parseFloat(stock.market_cap) || 0;
                const rsi = parseFloat(stock.rsi) || 0;
                const peRatio = parseFloat(stock.pe_ratio) || 0;
                
                const isPositive = change >= 0;
                const TrendIcon = isPositive ? TrendingUp : TrendingDown;
                
                return (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">{stock.symbol}</p>
                        <p className="text-sm text-muted-foreground">{stock.name || 'Unknown Company'}</p>
                        <Badge variant="outline" className="text-xs">
                          {stock.sector || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Vol: {(volume / 1000000).toFixed(1)}M</span>
                        {marketCap > 0 && <span>Cap: ${(marketCap / 1000000000).toFixed(1)}B</span>}
                        {rsi > 0 && <span>RSI: {rsi.toFixed(1)}</span>}
                        {peRatio > 0 && <span>P/E: {peRatio.toFixed(1)}</span>}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ${price.toFixed(2)}
                      </p>
                      <div className={`flex items-center gap-1 text-sm ${
                        isPositive ? "text-success" : "text-destructive"
                      }`}>
                        <TrendIcon className="w-3 h-3" />
                        {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Powered by 12 Data API</span>
            <span>Real-time algorithmic analysis</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
