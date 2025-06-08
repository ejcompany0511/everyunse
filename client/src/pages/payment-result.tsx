import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PaymentResult() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentResult, setPaymentResult] = useState<{
    success: boolean;
    message: string;
    amount?: number;
  } | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const impUid = urlParams.get('imp_uid');
    const merchantUid = urlParams.get('merchant_uid');
    const impSuccess = urlParams.get('imp_success');

    if (impUid && merchantUid) {
      verifyPayment(impUid, merchantUid, impSuccess === 'true');
    } else {
      setPaymentResult({
        success: false,
        message: "결제 정보가 올바르지 않습니다."
      });
      setIsProcessing(false);
    }
  }, []);

  const verifyPayment = async (impUid: string, merchantUid: string, success: boolean) => {
    try {
      if (!success) {
        setPaymentResult({
          success: false,
          message: "결제가 취소되었습니다."
        });
        setIsProcessing(false);
        return;
      }

      const verification = await apiRequest("POST", "/api/payment/verify", {
        impUid,
        merchantUid
      });

      if (verification.success) {
        setPaymentResult({
          success: true,
          message: `${verification.coinAmount}냥이 성공적으로 충전되었습니다!`,
          amount: verification.coinAmount
        });
        
        toast({
          title: "충전 완료",
          description: `${verification.coinAmount}냥이 충전되었습니다.`,
        });
      } else {
        throw new Error(verification.message || "결제 검증 실패");
      }
    } catch (error: any) {
      console.error("결제 검증 오류:", error);
      setPaymentResult({
        success: false,
        message: error.message || "결제 처리 중 오류가 발생했습니다."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoHome = () => {
    setLocation("/");
  };

  const handleGoToProfile = () => {
    setLocation("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">결제 결과</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {isProcessing ? (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-600" />
              <p className="text-gray-600">결제를 처리중입니다...</p>
            </div>
          ) : paymentResult ? (
            <div className="space-y-4">
              {paymentResult.success ? (
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 mx-auto text-red-500" />
              )}
              
              <div>
                <h3 className={`text-lg font-semibold ${
                  paymentResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {paymentResult.success ? '결제 성공' : '결제 실패'}
                </h3>
                <p className="text-gray-600 mt-2">
                  {paymentResult.message}
                </p>
              </div>

              <div className="space-y-2 pt-4">
                {paymentResult.success ? (
                  <>
                    <Button onClick={handleGoToProfile} className="w-full">
                      내 프로필 확인
                    </Button>
                    <Button onClick={handleGoHome} variant="outline" className="w-full">
                      홈으로 이동
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleGoHome} className="w-full">
                    홈으로 이동
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-red-700">오류 발생</h3>
                <p className="text-gray-600 mt-2">
                  결제 정보를 처리할 수 없습니다.
                </p>
              </div>
              <Button onClick={handleGoHome} className="w-full">
                홈으로 이동
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}