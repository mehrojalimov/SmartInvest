import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface StockData {
  symbol: string;
  time: string;
  open: string;
  high: string;
  low: string;
  price: string;
  volume: string;
}

export interface PortfolioAsset {
  stock_name: string;
  total_quantity: number;
}

export interface Transaction {
  stock_name: string;
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
}

export const useStockData = (symbol: string) => {
  return useQuery({
    queryKey: ['stock', symbol],
    queryFn: async (): Promise<StockData> => {
      const response = await fetch(`/api/stock/${symbol}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      return response.json();
    },
    enabled: !!symbol,
  });
};

export const usePortfolio = () => {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: async (): Promise<{ portfolio: PortfolioAsset[] }> => {
      const response = await fetch('/api/portfolio', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }
      return response.json();
    },
  });
};

export const usePortfolioHistory = () => {
  return useQuery({
    queryKey: ['portfolio-history'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/history', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio history');
      }
      return response.json();
    },
  });
};

export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: Transaction) => {
      const response = await fetch('/api/portfolio/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(transaction),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add transaction');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
};

export const useSavePortfolioHistory = () => {
  return useMutation({
    mutationFn: async (data: { portfolioHistory: number[]; dates: string[] }) => {
      const response = await fetch('/api/portfolio/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save portfolio history');
      }
      
      return response.json();
    },
  });
};
