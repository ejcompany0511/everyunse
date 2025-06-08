import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

export default function PaymentSuccess() {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // URL에서 결제 정보 추출
  const urlParams = new URLSearchParams(window.location.search);
  const paymentKey = urlParams.get("paymentKey");
  const orderId = urlParams.get("orderId");
  const amount = urlParams.get("amount");

  const confirmPayment = async () => {
    if (!paymentKey || !orderId || !amount) {
      toast({
        title: "오류",
        description: "결제 정보가 누락되었습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/payments/confirm", {
        paymentKey,
        orderId,
        amount
      });

      if (response.success) {
        setIsConfirmed(true);
        toast({
          title: "결제 완료",
          description: response.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/coins/balance"] });
      }
    } catch (error) {
      toast({
        title: "결제 승인 실패",
        description: "결제 승인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          {isConfirmed ? (
            <div className="text-center space-y-4">
              <img
                src="https://static.toss.im/illusts/check-blue-spot-ending-frame.png"
                width="120"
                height="120"
                className="mx-auto"
                alt="결제 완료"
              />
              <h2 className="text-2xl font-bold text-gray-800">결제를 완료했어요</h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">결제 금액</span>
                  <span className="font-medium">{parseInt(amount || "0").toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">주문번호</span>
                  <span className="font-medium text-xs">{orderId}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  className="w-full gradient-bg text-white"
                  onClick={() => navigate("/profile")}
                >
                  내 페이지로 돌아가기
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  홈으로 가기
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <img
                src="https://static.toss.im/lotties/loading-spot-apng.png"
                width="120"
                height="120"
                className="mx-auto"
                alt="로딩"
              />
              <h2 className="text-2xl font-bold text-gray-800">결제 요청까지 성공했어요.</h2>
              <p className="text-gray-600">결제 승인하고 완료해보세요.</p>
              
              <Button 
                className="w-full gradient-bg text-white"
                onClick={confirmPayment}
                disabled={isLoading}
              >
                {isLoading ? "승인 중..." : "결제 승인하기"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}