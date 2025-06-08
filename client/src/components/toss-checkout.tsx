import { useState } from "react";
import PortOne from "@portone/browser-sdk/v2";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PortOneCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  coinAmount: number;
  onSuccess: () => void;
}

export function PortOneCheckout({ isOpen, onClose, amount, coinAmount, onSuccess }: PortOneCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const response = await PortOne.requestPayment({
        storeId: import.meta.env.VITE_PORTONE_STORE_ID || "store-test",
        channelKey: import.meta.env.VITE_PORTONE_CHANNEL_KEY || "channel-key-test", 
        paymentId: orderId,
        orderName: `${coinAmount}냥 충전`,
        totalAmount: amount,
        currency: "KRW",
        payMethod: "CARD",
        customer: {
          fullName: "사주 사용자",
          email: "user@everyunse.com",
        },
        redirectUrl: `${window.location.origin}/payment/complete`,
        noticeUrls: [`${window.location.origin}/api/payment/webhook`],
        customData: {
          coinAmount: coinAmount.toString(),
          userId: "current_user_id"
        }
      });

      if (response.code !== undefined) {
        toast({
          title: "결제 실패",
          description: response.message || "결제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        return;
      }

      const verification = await apiRequest("POST", "/api/payment/verify", {
        paymentId: orderId,
        amount: amount,
        coinAmount: coinAmount
      });

      if (verification.success) {
        toast({
          title: "결제 완료",
          description: `${coinAmount}냥이 충전되었습니다!`,
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: "결제 검증 실패",
          description: "결제는 완료되었으나 검증에 실패했습니다. 고객센터에 문의해주세요.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("결제 오류:", error);
      toast({
        title: "결제 오류",
        description: "결제 중 예상치 못한 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            {coinAmount}냥 충전
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            결제 금액: {amount.toLocaleString()}원
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">충전 내역</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{coinAmount}냥</span>
              <span className="font-bold text-lg">{amount.toLocaleString()}원</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 결제 완료 후 즉시 냥이 충전됩니다
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              onClick={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? "결제 처리 중..." : "카드로 결제하기"}
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
              disabled={isLoading}
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export with the old name for backward compatibility
export { PortOneCheckout as TossCheckout };