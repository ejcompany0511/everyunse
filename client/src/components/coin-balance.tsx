import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coins, Plus, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CoinTransaction {
  id: number;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  serviceType: string | null;
  createdAt: string;
}

export default function CoinBalance() {
  const [isChargeOpen, setIsChargeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chargeAmount, setChargeAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 코인 잔액 조회
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/coins/balance"],
  });

  // 거래 내역 조회
  const { data: transactionsData } = useQuery({
    queryKey: ["/api/coins/transactions"],
    enabled: isHistoryOpen,
  });

  // 코인 충전
  const chargeMutation = useMutation({
    mutationFn: async (data: { amount: number }) => {
      return await apiRequest("POST", "/api/coins/charge", data);
    },
    onSuccess: (response) => {
      toast({
        title: "충전 완료",
        description: response.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/transactions"] });
      setIsChargeOpen(false);
      setChargeAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "충전 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCharge = () => {
    const amount = parseInt(chargeAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "잘못된 입력",
        description: "올바른 충전 금액을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    chargeMutation.mutate({ amount });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'charge':
        return 'bg-green-100 text-green-800';
      case 'spend':
        return 'bg-red-100 text-red-800';
      case 'refund':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (balanceLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Coins className="h-5 w-5 text-yellow-500" />
        <span className="text-sm">로딩중...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Coins className="h-5 w-5 text-yellow-500" />
      <span className="font-medium">{balanceData?.balance || 0}코인</span>
      
      {/* 충전 버튼 */}
      <Dialog open={isChargeOpen} onOpenChange={setIsChargeOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            충전
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>코인 충전</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">충전할 코인 수</Label>
              <Input
                id="amount"
                type="number"
                placeholder="충전할 코인 수를 입력하세요"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setChargeAmount("100")}
              >
                100코인
              </Button>
              <Button
                variant="outline"
                onClick={() => setChargeAmount("500")}
              >
                500코인
              </Button>
              <Button
                variant="outline"
                onClick={() => setChargeAmount("1000")}
              >
                1000코인
              </Button>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsChargeOpen(false)}
              >
                취소
              </Button>
              <Button
                onClick={handleCharge}
                disabled={chargeMutation.isPending}
              >
                {chargeMutation.isPending ? "충전중..." : "충전하기"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 거래 내역 버튼 */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost">
            <History className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>코인 거래 내역</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {transactionsData?.transactions?.length > 0 ? (
              <div className="space-y-2">
                {transactionsData.transactions.map((tx: CoinTransaction) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge className={getTransactionColor(tx.type)}>
                          {tx.type === 'charge' ? '충전' : 
                           tx.type === 'spend' ? '사용' : 
                           tx.type === 'refund' ? '환불' : tx.type}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {formatDate(tx.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{tx.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}코인
                      </p>
                      <p className="text-xs text-gray-500">
                        잔액: {tx.balanceAfter}코인
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                거래 내역이 없습니다.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}