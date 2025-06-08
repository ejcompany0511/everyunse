import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function HistoryPage() {
  const [, navigate] = useLocation();

  const { data: transactionData, isLoading } = useQuery({
    queryKey: ["/api/coins/transactions"],
  });

  const { data: coinData } = useQuery({
    queryKey: ["/api/coins/balance"],
  });

  const transactions = transactionData?.transactions || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    return type.includes('충전') || type.includes('추가') ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTransactionColor = (type: string) => {
    return type.includes('충전') || type.includes('추가') 
      ? 'text-green-600' 
      : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/my")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">거래 내역</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 현재 잔액 */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">현재 냥 잔액</p>
                <p className="text-3xl font-bold">{coinData?.balance || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm">총 거래 건수</p>
                <p className="text-xl font-semibold">{transactions.length}건</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 거래 내역 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>거래 내역</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">거래 내역을 불러오는 중...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">거래 내역이 없습니다.</p>
                <p className="text-sm text-gray-400 mt-2">냥을 충전하거나 사주 분석을 받아보세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.description)}
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getTransactionColor(transaction.description)}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}냥
                      </p>
                      <p className="text-sm text-gray-500">
                        잔액: {transaction.balanceAfter}냥
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 안내 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">거래 내역 안내</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>• 모든 냥 거래 내역이 실시간으로 기록됩니다</p>
            <p>• 충전 및 사용 내역을 상세하게 확인할 수 있습니다</p>
            <p>• 거래 내역은 영구적으로 보관됩니다</p>
            <p>• 문의사항이 있으시면 고객지원으로 연락해주세요</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}