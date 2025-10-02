import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface Transaction {
  id: number;
  stock_name: string;
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  transaction_date: string;
}

export const RecentTransactions = () => {
  const { data: transactionsData, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: async (): Promise<{ transactions: Transaction[] }> => {
      const response = await fetch('/api/transactions', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading transactions...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Error loading transactions</p>
        </CardContent>
      </Card>
    );
  }

  const transactions = transactionsData?.transactions || [];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No transactions yet. Start by buying some stocks!
            </p>
          ) : (
            transactions.map((transaction) => {
              const isBuy = transaction.transaction_type === "BUY";
              const Icon = isBuy ? ArrowDownRight : ArrowUpRight;
              const date = new Date(transaction.transaction_date);
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isBuy ? "bg-success/10" : "bg-primary/10"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isBuy ? "text-success" : "text-primary"
                        }`}
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">
                          {transaction.stock_name}
                        </p>
                        <Badge
                          variant={isBuy ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {transaction.transaction_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transaction.quantity} shares @ ${transaction.price?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      ${((transaction.quantity * (transaction.price || 0)).toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      }))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {date.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {date.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
